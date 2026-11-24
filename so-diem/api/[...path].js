export default async function handler(req, res) {
  const mod = await import('../server/src/index.js');
  const app = mod.default || mod;
  return app(req, res);
}