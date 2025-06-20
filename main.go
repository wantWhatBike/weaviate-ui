package main

import (
	"embed"
	"net/http"
	"os"
	"strings"
	"weaviate-ui/handler"

	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	client "github.com/weaviate/weaviate-go-client/v5/weaviate"
	"github.com/weaviate/weaviate-go-client/v5/weaviate/auth"
)

//go:embed static
var staticFS embed.FS

// CORS 中间件
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS, GET, PUT")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func main() {
	r := gin.Default()
	r.Use(corsMiddleware())

	// Weaviate client 初始化
	weaviateURL := os.Getenv("WEAVIATE_URL")
	weaviateAPIKey := os.Getenv("WEAVIATE_API_KEYS")
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "7777"
	}
	cfg := client.Config{
		Host:       strings.TrimPrefix(strings.TrimPrefix(weaviateURL, "http://"), "https://"),
		Scheme:     "http",
		AuthConfig: nil,
	}
	if weaviateAPIKey != "" {
		cfg.AuthConfig = auth.ApiKey{Value: weaviateAPIKey}
	}
	wClient, err := client.NewClient(cfg)
	if err != nil {
		panic(err)
	}

	r.GET("/schema", handler.SchemaHandler(wClient))
	r.GET("/tenants/:class_name", handler.TenantHandler(wClient))
	r.POST("/class/:class_name/tenant/:tenant/:offset/:limit/:keyword", handler.ClassHandler(wClient))

	// 使用embedded静态文件服务
	web, err := static.EmbedFolder(staticFS, "static")
	if err != nil {
		panic(err)
	}
	r.Use(static.Serve("/", web))
	r.NoRoute(func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/")
	})

	if err := r.Run(":" + port); err != nil {
		panic(err)
	}
}
