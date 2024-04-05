import { MiddlewareHandler } from "hono";
import { S3Client, type Container, createSqlDb } from "@publiz/core";
import { env } from "hono/adapter";
import { AppEnv } from "../global";
import { type Config } from "../config";
import { Pool } from "pg";
import { PostgresDialect } from "kysely";

let pool: Pool | null = null;

export const useDi = (): MiddlewareHandler => {
  return async (c, next) => {
    const {
      DB_HOST,
      DB_PORT,
      DB_USER,
      DB_PASSWORD,
      DB_DATABASE,
      DB_SSL,
      DB_SSL_REJECT_UNAUTHORIZED,
      DB_PREPARE,
      FIREBASE_API_KEY,
      FIREBASE_PROJECT_ID,
      ADMIN_AUTH_IDS = "",
      S3_BUCKET,
      S3_ACCESS_KEY_ID,
      S3_SECRET_ACCESS_KEY,
      S3_REGION,
      S3_ENDPOINT,
      S3_GET_GCS_IMAGE_SERVING_ENDPOINT,
      CORS_ORIGIN = "*",
      CORS_ALLOW_HEADERS = "Content-Type, Authorization",
      CORS_ALLOW_METHODS = "GET,POST,PUT,DELETE",
      CORS_MAX_AGE = "600",
      CORS_CREDENTIALS = "true",
      HYPERDRIVE,
    } = env<AppEnv["Bindings"]>(c);

    const config = {
      db: {
        host: HYPERDRIVE ? HYPERDRIVE.host : DB_HOST,
        port: (HYPERDRIVE ? parseInt(HYPERDRIVE.port, 10) : DB_PORT) || 5432,
        user: HYPERDRIVE ? HYPERDRIVE.user : DB_USER,
        password: HYPERDRIVE ? HYPERDRIVE.password : DB_PASSWORD,
        database: HYPERDRIVE ? HYPERDRIVE.database : DB_DATABASE,
        ssl: DB_SSL
          ? { rejectUnauthorized: DB_SSL_REJECT_UNAUTHORIZED === "true" }
          : false,
        prepare: DB_PREPARE === "true",
      },
      firebase: {
        apiKey: FIREBASE_API_KEY,
        projectId: FIREBASE_PROJECT_ID,
      },
      admin: {
        authIds: ADMIN_AUTH_IDS.split(","),
      },
      s3: {
        bucket: S3_BUCKET,
        accessKeyId: S3_ACCESS_KEY_ID,
        secretAccessKey: S3_SECRET_ACCESS_KEY,
        endpoint: S3_ENDPOINT,
        region: S3_REGION,
        getGcsImageServingEndpoint: S3_GET_GCS_IMAGE_SERVING_ENDPOINT,
      },
      cors: {
        origin: CORS_ORIGIN.split(","),
        allowHeaders: CORS_ALLOW_HEADERS.split(","),
        allowMethods: CORS_ALLOW_METHODS.split(","),
        maxAge: parseInt(CORS_MAX_AGE, 10),
        credentials: CORS_CREDENTIALS === "true",
      },
    };
    if (!pool) {
      pool = new Pool(config.db);
    }
    const dialect = new PostgresDialect({
      pool,
    });
    c.set("config", config);
    c.set("container", {
      sqlDb: createSqlDb(dialect),
      s3: new S3Client({
        endpoint: config.s3.endpoint,
        region: config.s3.region,
        credentials: {
          accessKeyId: config.s3.accessKeyId,
          secretAccessKey: config.s3.secretAccessKey,
        },
        forcePathStyle: true,
      }),
    });
    await next();
  };
};

export type DiVariables = {
  container: Container;
  config: Config;
};
