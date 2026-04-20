import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Dashboard() {
  const [uploads, setUploads] = useState([]);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const u = await api.get('/uploads');
    setUploads(u.data.uploads);
  };

  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    e.preventDefault();
    setErr('');

    if (!title.trim()) return setErr('Title required');
    if (!file) return setErr('Pick a file');

    if (file.size > 5 * 1024 * 1024)
      return setErr('Max 5 MB');

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
      return setErr('JPG/PNG/WEBP only');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', title); // 🔥 send title

    try {
      setLoading(true);
      await api.post('/uploads', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFile(null);
      setTitle('');
      load();
    } catch (e) {
      setErr(e.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const delUpload = async (id) => {
    await api.delete('/uploads/' + id);
    load();
  };

  return (
    <div className="container">
      <h2>Dashboard</h2>
      {err && <div className="error">{err}</div>}

      <div className="main">

        {/* LEFT SIDE */}
        <div className="left">
          <h3>Upload Image</h3>

          <form onSubmit={upload}>
            <div className="field">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter title"
                required
              />
            </div>

            <div className="field">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <button disabled={loading}>
              {loading ? "Uploading... Please wait" : "Upload"}
            </button>
          </form>
        </div>

        {/* MIDDLE LINE */}
        <div className="divider"></div>

        {/* RIGHT SIDE */}
        <div className="right">
          <h3>Your uploads</h3>

          <div className="gallery">
  {uploads.map(u => (
    <div key={u._id} className="gallery-card">

      <img src={u.url} alt="" />

      {/* TITLE FIX */}
      <div className="img-title">
        {u.title || u.originalName}
      </div>

      {/* DELETE BUTTON FIX */}
      <button
        className="delete-btn"
        onClick={() => delUpload(u._id)}
      >
        Delete
      </button>

    </div>
  ))}
</div>
        </div>

      </div>
    </div>
  );
}