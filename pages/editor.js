import dynamic from "next/dynamic";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import "react-quill/dist/quill.snow.css";

// Dynamically import ReactQuill
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// Toolbar formats
const toolbarFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'blockquote', 'code-block',
  'link', 'image', 'align', 'color', 'background'
];

export default function Editor() {
  const router = useRouter();
  const { id } = router.query;

  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);

  const quillRef = useRef(null); // ReactQuill ref
  const [quillEditor, setQuillEditor] = useState(null); // real Quill instance

  // Load existing post if editing
  useEffect(() => {
    if (!id) return;
    const raw = localStorage.getItem("blog_posts");
    if (!raw) return;
    const posts = JSON.parse(raw);
    const post = posts.find((p) => p.id === id);
    if (post) {
      setTitle(post.title);
      setTagsInput((post.tags || []).join(", "));
      setContent(post.contentHtml);
    }
  }, [id]);

  // Image Handler
  const imageHandler = useCallback(() => {
    if (!quillEditor) return;

    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const range = quillEditor.getSelection(true);
        quillEditor.insertEmbed(range.index, "image", reader.result);
        quillEditor.setSelection(range.index + 1);
      };
      reader.readAsDataURL(file);
    };
  }, [quillEditor]);

  // Quill modules (no handlers here, attach later)
  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["link", "image"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ["clean"]
    ]
  }), []);

  // Save Draft / Publish
  const saveDraft = (published = false) => {
    const allRaw = localStorage.getItem("blog_posts");
    const list = allRaw ? JSON.parse(allRaw) : [];
    const newPost = {
      id: id || "post_" + Date.now(),
      title,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      contentHtml: content,
      published,
      updatedAt: Date.now(),
    };
    const exists = list.findIndex((p) => p.id === newPost.id);
    if (exists >= 0) list[exists] = newPost;
    else list.unshift(newPost);
    localStorage.setItem("blog_posts", JSON.stringify(list));
    router.push("/");
  };

  // Download PDF
  const handleDownloadPDF = () => {
    if (typeof window === "undefined") return;
    import("html2pdf.js").then(({ default: html2pdf }) => {
      let element;
      if (preview) {
        element = document.getElementById("post-content");
      } else {
        element = document.querySelector(".ql-editor");
      }
      if (!element) return;
      html2pdf()
        .from(element)
        .set({
          margin: 10,
          filename: (title ? title.replace(/\s+/g, "_") : "post") + ".pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .save();
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        padding: 24,
        background: "linear-gradient(135deg, #f5f7fb, #e3f0ff)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 style={{ color: "#0bb7d1ff", fontSize: "1.8rem" }}>
          {id ? "Edit Post" : "New Post"}
        </h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn secondary" onClick={() => setPreview((p) => !p)}>
            {preview ? "Edit" : "Preview"}
          </button>
          <button className="btn" onClick={() => saveDraft(true)}>
            Publish
          </button>
          <button className="btn" onClick={handleDownloadPDF}>Download PDF</button>
        </div>
      </div>

      {/* Title and Tags */}
      <input
        placeholder="Post title"
        className="input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        placeholder="Tags (comma separated)"
        className="tag-input"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
      />

      {/* Editor / Preview */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          marginTop: 12,
          overflow: "hidden",
          borderRadius: 8,
          boxShadow: "0 6px 20px rgba(20,30,60,0.08)",
        }}
      >
        {!preview ? (
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={(val, delta, source, editor) => {
              setContent(val);
              if (!quillEditor && quillRef.current) {
                const realEditor = quillRef.current.getEditor();
                setQuillEditor(realEditor);

                // Bind image handler now
                const toolbar = realEditor.getModule("toolbar");
                toolbar.addHandler("image", imageHandler);
              }
            }}
            modules={modules}
            formats={toolbarFormats}
            placeholder="Write your post here..."
            style={{ flex: 1, minHeight: 400, overflowY: "auto", borderRadius: "8px 8px 0 0" }}
          />
        ) : (
          <div
            id="post-content"
            dangerouslySetInnerHTML={{ __html: content }}
            style={{ flex: 1, overflowY: "auto", padding: 12, background: "#fff" }}
          />
        )}
      </div>

      {/* Sticky Buttons */}
      <div style={{ display: "flex", gap: 12, marginTop: 12, flexShrink: 0 }}>
        <button className="btn" onClick={() => saveDraft(false)}>
          Save Draft
        </button>
        <button className="btn" onClick={() => saveDraft(true)}>
          Publish
        </button>
        <button
          className="btn secondary"
          onClick={() => {
            setTitle("");
            setTagsInput("");
            setContent("");
          }}
        >
          Clear
        </button>
      </div>

      <style jsx>{`
        .btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          background: #0bb7d1ff;
          color: #fff;
          transition: all 0.2s;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .btn.secondary {
          background: #33a17a;
        }
        .btn.secondary:hover {
          background: #238066;
        }
        .input,
        .tag-input {
          padding: 12px;
          margin-bottom: 12px;
          border-radius: 8px;
          border: 1px solid #e3e8ef;
          font-size: 14px;
          width: 100%;
        }
        .input:focus,
        .tag-input:focus {
          outline: none;
          border-color: #0bb7d1ff;
        }
      `}</style>
    </div>
  );
}
