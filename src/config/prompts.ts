export const prompts = {
  script: {
    system: (lang: string) => 
      `Generate Reel Script in ${lang} as PLAIN JSON without markdown: Scroll-Stopping Content That Converts

Step 1: Craft the Hook (0–3 Seconds)
Goal: Grab attention immediately and convince viewers to keep watching.

Hook Types:

First Dialogue: Say something bold, surprising, or relatable.
“Stop making this skincare mistake!”
“I quit my 9-5 job, and here’s how…”
First Text: Overlay text that sparks curiosity.
“This $5 hack changed my life.”
“Why no one told me this sooner?!”
Cover/Thumbnail: Use a visually striking clip or animation (e.g., before/after shots, expressive facial reactions).
💡 Pro Tip: Use hooks that align with your audience’s pain points, desires, or trends.

Step 2: Build the Body (4–45 Seconds)
Goal: Deliver value quickly and keep viewers hooked.

Script Checklist:
✅ Keywords: Include 2–3 SEO-friendly keywords (e.g., “quick recipes,” “budget travel hacks”).
✅ Emotion: Match tone to your message (fun, urgent, inspiring, etc.).
✅ Length: Keep it under 100 words (aim for 30–45 seconds total).
✅ Audience: Write for their knowledge level (e.g., “beginners” vs. “experts”).

Structure:

Problem: State the issue your audience faces.
“Struggling to wake up early?”
Solution: Break it into bite-sized steps or insights.
“Try this 2-minute routine…”
Proof: Add quick visuals/text to validate your point (stats, before/after, testimonials).
💡 Pro Tip: Follow the KISS Principle—use simple language. Tools like Wordtune can simplify complex terms.

Step 3: Add a CTA (Last 3–5 Seconds)
Goal: Tell viewers what to do next.

Creative CTAs:

“Follow for Part 2!”
“Double tap if you’re trying this!”
“Drop a 🔥 for more tips.”
“Link in bio for the full guide.”
💡 Pro Tip: Rotate CTAs to avoid repetition. Pair with a gesture (e.g., pointing to the “Follow” button).

✅ Final Script Checklist:
✔ Hook in first 3 seconds
✔ Clear problem-solution structure
✔ Keywords + trending audio
✔ CTA with emojis/action verbs
✔ Total length: 30–60 seconds

Example Script (30-Second Cooking Reel)

Hook (Text Overlay): “You’re wasting money on store-bought snacks.”
Body:
“This 3-ingredient protein bar costs $1!” [Show ingredients]
“Mix, freeze, done. No baking!” [Quick cuts of mixing process]
CTA: “Save this before Walmart finds out!” [Wink + save animation]
🔑 Key Takeaways:

Test hook variations (dialogue vs. text vs. visual).
Use trending audio and hashtags for algorithm favor.
Repurpose top-performing scripts with new angles.
By following this prompt, you’ll create scroll-stopping Reels that convert casual viewers into loyal followers.
Use this exact structure:
      {
        "scenes": [{
          "sceneId": "unique-id-1",
          "type": "intro|scene|closing",
          "visual": {"description": "...", "elements": ["item1", "item2"]},
          "narration": {"text": "...", "keyPoints": ["point1"], "steps": []},
          "duration": 30,
          "platform": {}
        }]
      }
      Return ONLY the JSON object without any additional text or comments.`,

    user: (content: string) => 
      `Content:\n${content}\n\nGenerate script JSON:`
  },

  captions: {
    system: (lang: string, count: number) => 
      `Generate ${count} distinct Instagram captions in ${lang} without numbering or markdown. Separate with newlines. Include emojis and hashtags.`,
    user: (content: string, count: number) => 
      `Content:\n${content}\n\nGenerate ${count} captions (newline separated):`
  },

  summary: {
    system: (lang: string) => `Generate concise summary in ${lang}:`,
    user: (content: string) => `Content: ${content}`
  },
  expertise: {
    system: (lang: string) => `Identify expertise areas in ${lang}:`,
    user: (content: string) => `Analyze: ${content}`
  },
  variation: {
    system: (lang: string) => `Create variations in ${lang}:`,
    user: (content: string) => `Original: ${content}`
  }
} as const;

export type PromptType = keyof typeof prompts;