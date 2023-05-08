import "reflect-metadata";
import cors from "cors";
import express from "express";
import http from "http";
import bodyParser from 'body-parser';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServer, BaseContext } from '@apollo/server';
import { typeDefs } from './schema/schema';
import { resolvers } from './resolvers/resolvers';
import { db } from "./datasource/data-source";
import { DataContext } from "./types";
import { User } from "./entity/User";
import { verify } from "jsonwebtoken";

const app = express();

const httpServer = http.createServer(app)

// CORS configuration.
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
  };

// Initialize the Data Source.
await db.initialize()
  .then(() => {
    console.log("Data Source has been initialized!")
  })
  .catch((err) => {
    console.error("Error during Data Source initialization", err)
  })

const server: ApolloServer<DataContext> = new ApolloServer({ 
  typeDefs,
  resolvers
});

await server.start();

/**
 * Express application middleware setup.
 *
 * The following middleware are applied to the root route ('/') of the Express application:
 * - CORS middleware with custom options (`corsOptions`) to handle cross-origin requests.
 * - JSON body parsing middleware using `bodyParser` to parse incoming request bodies as JSON.
 * - Apollo Server Express middleware (`expressMiddleware`) to integrate the Apollo Server v4 with Express.
 *   - The `context` option is set to an async function that extracts the JWT token from the request headers,
 *     verifies the token, retrieves the corresponding user from the database, and provides the user and the
 *     database as the context to the Apollo Server resolvers.
 *     - If the token is invalid or there is an error during verification, the user is not set in the context.
 *     - The database instance (`db`) is passed as part of the data source for the context.
 *
 * @returns {void}
 */
app.use(
  '/',
  cors(corsOptions),
  bodyParser.json(),
  expressMiddleware(server as unknown as ApolloServer<BaseContext>, {
    context: async ({ req }) => {
      const token = req.headers.authorization?.replace('Bearer ', '') || '';
      try {
        const decoded: any = verify(token, process.env.JWT_SECRET as string);
        const user = await db.manager.findOneBy(User, { id: decoded.id});
        return {
          user,
          dataSource: {
            database: db,
          },
        };
      } catch (error) {
          console.log(error);
        return {
          dataSource: {
            database: db,
          },
        };
      }
    },
  }),
);

// Start the HTTP server and log the server's URL.
await new Promise<void>((resolve) => httpServer.listen({ port: 4000 }, resolve));
console.log(`🚀 Server ready at http://localhost:4000/`);