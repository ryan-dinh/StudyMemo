const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';

export default function CardImageUpload({ imageUrl, onUpload, onRemove }) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    setUploading(false);
    onUpload(file_url);
    ref.current.value = '';
  };

  if (imageUrl) {
    return (
      <div className="relative group/img mt-2">
        <img src={imageUrl} alt="" className="w-full max-h-28 object-contain rounded-lg border border-border bg-muted" />
        <button
          onClick={onRemove}
          className="absolute top-1 right-1 bg-background/90 rounded-full p-1 opacity-0 group-hover/img:opacity-100 transition-opacity border border-border"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => ref.current.click()}
      disabled={uploading}
      className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
      {uploading ? 'Uploading…' : 'Add image'}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </button>
  );
}