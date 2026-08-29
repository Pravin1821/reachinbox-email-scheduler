import { Client } from "@elastic/elasticsearch";

const client = new Client({ node: "http://localhost:9200" });

export const EMAIL_INDEX = "emails";

export async function ensureEmailIndex() {
  const exists = await client.indices.exists({ index: EMAIL_INDEX });
  if (!exists) {
    await client.indices.create({
      index: EMAIL_INDEX,
      mappings: {
        properties: {
          to: { type: "keyword" },
          subject: { type: "text" },
          body: { type: "text" },
          status: { type: "keyword" },
          senderId: { type: "keyword" },
          scheduledAt: { type: "date" },
          sentAt: { type: "date" },
        },
      },
    });
    console.log(`[search] created index "${EMAIL_INDEX}"`);
  }
}

export async function indexEmail(email: {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: string;
  senderId: string;
  scheduledAt: Date;
  sentAt: Date | null;
  previewUrl?: string | null;
}) {
  try {
    await client.index({
      index: EMAIL_INDEX,
      id: email.id,
      document: {
        to: email.to,
        subject: email.subject,
        body: email.body,
        status: email.status,
        senderId: email.senderId,
        scheduledAt: email.scheduledAt,
        sentAt: email.sentAt,
        previewUrl: email.previewUrl ?? null,
      },
    });
  } catch (err: any) {
    console.error(`[search] failed to index email ${email.id}:`, err.message);
  }
}

export async function searchEmails(query: string) {
  const result = await client.search({
    index: EMAIL_INDEX,
    query: {
      multi_match: {
        query,
        fields: ["subject", "body", "to"],
        fuzziness: "AUTO", 
      },
    },
  });

  return result.hits.hits.map((hit: any) => ({ id: hit._id, score: hit._score, ...hit._source }));
}