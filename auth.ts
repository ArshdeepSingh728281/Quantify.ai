// import NextAuth from "next-auth";
// import Google from "next-auth/providers/google";
// import { MongoDBAdapter } from "@auth/mongodb-adapter";

// import clientPromise from "@/lib/mongodb";

// export const { handlers, auth, signIn, signOut } = NextAuth({
//   adapter: MongoDBAdapter(clientPromise),

//   providers: [
//     Google({
//       clientId:
//         process.env.GOOGLE_CLIENT_ID!,

//       clientSecret:
//         process.env.GOOGLE_CLIENT_SECRET!,
//     }),
//   ],

//   session: {
//     strategy: "database",
//   },

//   pages: {
//     signIn: "/",
//   },

//   callbacks: {
//     async session({
//       session,
//       user,
//     }) {
//       if (session.user) {
//         session.user.id = user.id;
//       }

//       return session;
//     },
//   },

//   secret:
//     process.env.NEXTAUTH_SECRET,

//   trustHost: true,
// });











// import NextAuth from "next-auth";
// import Google from "next-auth/providers/google";
// import { MongoDBAdapter } from "@auth/mongodb-adapter";

// import clientPromise from "@/lib/mongodb";

// export const {
//   handlers,
//   auth,
//   signIn,
//   signOut,
// } = NextAuth({
//   adapter: MongoDBAdapter(
//     clientPromise
//   ),

//   providers: [
//     Google({
//       clientId:
//         process.env.GOOGLE_CLIENT_ID!,

//       clientSecret:
//         process.env.GOOGLE_CLIENT_SECRET!,
//     }),
//   ],

//   session: {
//     strategy: "database",
//   },

//   pages: {
//     signIn: "/",
//   },

//   callbacks: {
//     async session({
//       session,
//       user,
//     }) {
//       if (session.user) {
//         session.user.id = user.id;
//       }

//       return session;
//     },
//   },

//   secret:
//     process.env.NEXTAUTH_SECRET,

//   trustHost: true,
// });




import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: MongoDBAdapter(clientPromise),

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "database",
  },

  pages: {
    signIn: "/",
  },

  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  trustHost: true,
});