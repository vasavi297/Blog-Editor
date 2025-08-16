import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import 'react-quill/dist/quill.snow.css';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph } from "docx";
import html2pdf from 'html2pdf.js';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function Editor() {
  const router = useRouter();
  const { id } = router.query;
  const quillRef = useRef(null);

  const [title, setTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState(false);
  const [modules, setModules] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (async () => {
      const QuillModule = await import('quill');
      const Quill = QuillModule.default;

      const Font = Quill.import('formats/font');
      Font.whitelist = ['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy'];
      Quill.register(Font, true);

      setModules({
        toolbar: [
          [{ font: Font.whitelist }],
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          ['clean']
        ]
      });
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    const raw = localStorage.getItem('blog_posts');
    if (!raw) return;
    const posts = JSON.parse(raw);
    const post = posts.find(p => p.id === id);
    if (post) {
      setTitle(post.title);
      setTagsInput((post.tags || []).join(', '));
      setContent(post.contentHtml);
    }
  }, [id]);

  const saveDraft = (published = false) => {
    const allRaw = localStorage.getItem('blog_posts');
    const list = allRaw ? JSON.parse(allRaw) : [];
    const newPost = {
      id: id || 'post_' + Date.now(),
      title,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      contentHtml: content,
      published,
      updatedAt: Date.now(),
    };
    const exists = list.findIndex(p => p.id === newPost.id);
    if (exists >= 0) list[exists] = newPost;
    else list.unshift(newPost);
    localStorage.setItem('blog_posts', JSON.stringify(list));
    router.push('/');
  };

  // --- Multi-format save ---
  const handleSaveAs = (format) => {
    if (!format) return;

    switch(format) {
      case 'json':
        saveAsJSON();
        break;
      case 'html':
        saveAsHTML();
        break;
      case 'docx':
        saveAsDOCX();
        break;
      case 'pdf':
        saveAsPDF();
        break;
    }
  };

  const saveAsJSON = () => {
    const postData = { title, tags: tagsInput.split(',').filter(Boolean), content };
    const blob = new Blob([JSON.stringify(postData, null, 2)], { type: 'application/json' });
    saveAs(blob, `${title || 'post'}.json`);
  };

  const saveAsHTML = () => {
    const htmlData = `
      <html>
        <head><meta charset="UTF-8"><title>${title}</title></head>
        <body style="font-family:sans-serif; padding:20px;">
          <h1>${title}</h1>
          <p><strong>Tags:</strong> ${tagsInput}</p>
          <hr/>
          ${content}
        </body>
      </html>
    `;
    const blob = new Blob([htmlData], { type: 'text/html' });
    saveAs(blob, `${title || 'post'}.html`);
  };

  const saveAsDOCX = () => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: title, heading: "Heading1" }),
            new Paragraph({ text: `Tags: ${tagsInput}` }),
            new Paragraph({ text: content.replace(/<[^>]+>/g, '') })
          ]
        }
      ]
    });
    Packer.toBlob(doc).then(blob => saveAs(blob, `${title || 'post'}.docx`));
  };

  const saveAsPDF = () => {
    const element = document.createElement('div');
    element.innerHTML = `<h1>${title}</h1><p>Tags: ${tagsInput}</p>${content}`;
    html2pdf().from(element).save(`${title || 'post'}.pdf`);
  };

  if (!modules) return <p>Loading editor...</p>;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', padding:'24px', boxSizing:'border-box', background:'linear-gradient(135deg,#f5f7fb,#e3f0ff)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
        <h2 style={{ color:'#0bb7d1ff', fontSize:'1.8rem' }}>{id ? 'Edit Post' : 'New Post'}</h2>
        <div style={{ display:'flex', gap:'10px' }}>
          <button className="btn secondary" onClick={() => setPreview(p => !p)}>{preview ? 'Edit' : 'Preview'}</button>
          <button className="btn" onClick={() => saveDraft(true)}>Publish</button>
        </div>
      </div>

      <input placeholder="Post title" className="input" value={title} onChange={e => setTitle(e.target.value)} />
      <input placeholder="Tags" className="tag-input" value={tagsInput} onChange={e => setTagsInput(e.target.value)} />

      <div style={{ flex:1, display:'flex', flexDirection:'column', marginTop:'12px', overflow:'hidden', borderRadius:'8px', boxShadow:'0 6px 20px rgba(20,30,60,0.08)' }}>
        {!preview ? (
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            formats={[
              'font','header','bold','italic','underline','strike',
              'list','bullet','blockquote','code-block','link','image',
              'align','color','background'
            ]}
            placeholder="Write your post here..."
            style={{ flex:1, minHeight:'400px', overflowY:'auto', borderRadius:'8px 8px 0 0' }}
          />
        ) : (
          <div className="preview" dangerouslySetInnerHTML={{__html: content}} style={{ flex:1, overflowY:'auto', padding:'12px', background:'#fff' }} />
        )}
      </div>

      <div style={{ display:'flex', gap:'12px', marginTop:'12px', flexShrink:0 }}>
        <button className="btn" onClick={() => saveDraft(false)}>Save Draft</button>
        <button className="btn" onClick={() => saveDraft(true)}>Publish</button>
        <button className="btn secondary" onClick={() => { setTitle(''); setTagsInput(''); setContent('') }}>Clear</button>

        <select onChange={(e) => handleSaveAs(e.target.value)} className="btn secondary">
          <option value="">Save As...</option>
          <option value="json">JSON</option>
          <option value="html">HTML</option>
          <option value="docx">DOCX</option>
          <option value="pdf">PDF</option>
        </select>
      </div>

      <style jsx>{`
        .btn {
          transition: all 0.2s;
          padding:10px 18px;
          border:none;
          border-radius:6px;
          cursor:pointer;
          font-size:14px;
          background:#0bb7d1ff;
          color:white;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow:0 4px 12px rgba(0,0,0,0.15);
        }
        .btn.secondary { background:#0bb7d1ff; }
        .btn.secondary:hover { background:#0bb7d1ff; }
        .input, .tag-input {
          padding:12px;
          margin-bottom:12px;
          border-radius:8px;
          border:1px solid #e3e8ef;
          font-size:14px;
          width:100%;
          box-sizing:border-box;
        }
        .input:focus, .tag-input:focus { outline:none; border-color:#0b76d1; }
      `}</style>
    </div>
  );
}
