CREATE TABLE "page_cache" (
    "url" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_cache_pkey" PRIMARY KEY ("url")
);
