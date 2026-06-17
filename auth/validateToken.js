export async function validateToken(token, env) {

    const raw =
        await env.SUBSCRIPTIONS.get(token);

    if (!raw)
        return {
            valid:false,
            error:"کد فعال‌سازی یافت نشد"
        };

    const data = JSON.parse(raw);

    if (!data.active)
        return {
            valid:false,
            error:"اشتراک غیرفعال است"
        };

    if (Date.now() > data.expires_at)
        return {
            valid:false,
            error:"اشتراک منقضی شده است"
        };

    if (
        data.messages_used >=
        data.message_limit
    )
        return {
            valid:false,
            error:"سقف پیام‌ها تمام شده است"
        };

    return {
        valid:true,
        data
    };
}