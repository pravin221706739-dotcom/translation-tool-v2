export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { text, source, target } = req.query;

    if (!text) {
        return res.status(400).json({ error: "Missing text parameter" });
    }

    const srcLang = source === "zh" ? "zh-CHS" : "en";
    const tgtLang = target === "zh" ? "zh-CHS" : "en";

    try {
        const authResponse = await fetch("https://edge.microsoft.com/translate/auth", {
            method: "POST"
        });

        if (!authResponse.ok) {
            throw new Error(`Auth failed: ${authResponse.status}`);
        }

        const token = await authResponse.text();

        const transResponse = await fetch(
            `https://api-edge.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${srcLang}&to=${tgtLang}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify([{ "Text": text }])
            }
        );

        if (!transResponse.ok) {
            throw new Error(`Translation failed: ${transResponse.status}`);
        }

        const data = await transResponse.json();

        if (data && data[0] && data[0].translations && data[0].translations[0]) {
            return res.status(200).json({ 
                translatedText: data[0].translations[0].text.trim() 
            });
        }

        throw new Error("Invalid translation response structure");
    } catch (error) {
        console.error("Translation proxy error:", error);
        return res.status(500).json({ error: error.message });
    }
}
