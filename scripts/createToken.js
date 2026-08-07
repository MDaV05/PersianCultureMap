export function generateToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const code = new Uint8Array(8);
  crypto.getRandomValues(code);

  let token = "FP-";
  for (let i = 0; i < code.length; i++) {
    token += chars[code[i] % chars.length];
  }

  return token;
}