import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    const raw = localStorage.getItem('blog_posts')
    setPosts(raw ? JSON.parse(raw) : [])
  }, [])

  const handleDelete = (id) => {
    const all = posts.filter(x => x.id !== id)
    localStorage.setItem('blog_posts', JSON.stringify(all))
    setPosts(all)
  }

  return (
    <div style={{
      display:'flex', flexDirection:'column', minHeight:'100vh',
      background:'linear-gradient(135deg, #f5f7fb, #e3f0ff)', padding:'24px', boxSizing:'border-box'
    }}>
      
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <h1 style={{ color:'#0bb7d1ff', fontSize:'2rem' }}>My Blog</h1>
        <Link href="/editor"><button  className="btn">+ New Post</button></Link>
      </div>

      {posts.length === 0 && (
        <p style={{ color:'#333', fontSize:'16px' }}>
          No posts yet. Click <strong>New Post</strong> to create one.
        </p>
      )}

      <div style={{ display:'grid', gap:'24px' }}>
        {posts.map(p => (
          <div key={p.id} className="post-card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <h3 className="post-title">{p.title || '(Untitled)'}</h3>
                <div className="tags">{(p.tags || []).map((t,i) => <span key={i}>{t}</span>)}</div>
                <div className="post-date">{new Date(p.updatedAt).toLocaleString()}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                <Link href={{ pathname:'/editor', query:{ id:p.id } }}>
                  <button className="btn edit-btn">Edit</button>
                </Link>
                <button onClick={() => handleDelete(p.id)} className="btn secondary delete-btn">Delete</button>
              </div>
            </div>

            {/* Full content */}
            <div className="post-full" dangerouslySetInnerHTML={{ __html: p.contentHtml }} />

            {/* Images */}
            <div className="post-images">
              {p.contentHtml.match(/<img[^>]+>/g)?.map((imgTag, idx) => (
                <div key={idx} dangerouslySetInnerHTML={{ __html: imgTag }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Styles */}
      <style jsx>{`
        .btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          background:#0bb7d1ff;
          color:#fff;
          transition: all 0.2s;
        }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .btn.secondary { background:#0bb7d1ff; }
        .btn.secondary:hover { background: #099ebc; }

        .post-card {
          background:#fff;
          border-radius:16px;
          padding:16px;
          box-shadow:0 6px 20px rgba(20,30,60,0.08);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .post-card:hover { transform:translateY(-5px); box-shadow:0 10px 25px rgba(20,30,60,0.12); }

        .post-title { 
          margin:0; 
          font-size:1.3rem; 
          color:#0bb7d1ff; 
          margin-bottom:12px;
        }
        .post-title:hover { color:#095a9a; }

        .tags { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; }
        .tags span { background:#e0f0ff; color:#0b76d1; padding:2px 8px; border-radius:12px; font-size:12px; }

        .post-date { font-size:12px; color:#6b7280; margin-bottom:12px; }

        .post-full {
          margin-top:12px;
          line-height:1.6;
          color:#333;
          font-size:14px;
          word-break: break-word;
        }

        .post-images img { max-width:100%; border-radius:12px; margin-top:8px; }
      `}</style>
    </div>
  )
}
