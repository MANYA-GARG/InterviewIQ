import mongoose from 'mongoose';

const ragChunkSchema = new mongoose.Schema(
  {
    docId: { type: String, required: true, index: true },
    chunkIndex: { type: Number, default: 0 },
    topic: { type: String, required: true, index: true },
    title: { type: String, default: '' },
    text: { type: String, required: true },
    embedding: { type: [Number], default: [] },
  },
  { timestamps: true, collection: 'rag_chunks' }
);

export default mongoose.model('RagChunk', ragChunkSchema);