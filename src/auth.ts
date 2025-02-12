import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory"
import { admin } from "better-auth/plugins"

export const auth = betterAuth({
    // TODO: change to postgres
    database: memoryAdapter({
        user: [],
        session: [],
        account: [],
        verification: [],
        jwks: []
    }),
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }
    },
    plugins: [
        admin()
    ]
})