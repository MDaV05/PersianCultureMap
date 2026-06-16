export function generateToken() {

    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let code = "FP-";

    for (let i = 0; i < 8; i++) {

        code += chars[
            Math.floor(
                Math.random() * chars.length
            )
        ];
    }

    return code;
}