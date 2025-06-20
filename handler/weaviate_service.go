package handler

import (
	"context"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	client "github.com/weaviate/weaviate-go-client/v5/weaviate"
	"github.com/weaviate/weaviate-go-client/v5/weaviate/auth"
	"github.com/weaviate/weaviate-go-client/v5/weaviate/graphql"
)

// 初始化 Weaviate 客户端
func InitWeaviateClient() *client.Client {
	weaviateURL := os.Getenv("WEAVIATE_URL")
	weaviateAPIKey := os.Getenv("WEAVIATE_API_KEYS")
	cfg := client.Config{
		Host:   strings.TrimPrefix(strings.TrimPrefix(weaviateURL, "http://"), "https://"),
		Scheme: "http",
	}
	if weaviateAPIKey != "" {
		cfg.AuthConfig = auth.ApiKey{Value: weaviateAPIKey}
	}
	wClient, err := client.NewClient(cfg)
	if err != nil {
		panic(err)
	}
	return wClient
}

// /schema 路由处理
func SchemaHandler(wClient *client.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		schema, err := wClient.Schema().Getter().Do(context.Background())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, schema)
	}
}

// /class/:class_name/:offset/:limit/:keyword 路由处理
func ClassHandler(wClient *client.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		className := c.Param("class_name")
		tenant := c.Param("tenant")
		offset, _ := strconv.Atoi(c.Param("offset"))
		limit, _ := strconv.Atoi(c.Param("limit"))
		keyword := c.Param("keyword")
		var req struct {
			Properties []string `json:"properties"`
		}
		_ = c.ShouldBindJSON(&req)
		if len(req.Properties) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "body params properties cannot by empty"})
			return
		}

		// 构建 GraphQL 查询
		gql := wClient.GraphQL().Get().
			WithClassName(className).
			WithTenant(tenant).
			WithFields(func() []graphql.Field {
				fields := make([]graphql.Field, len(req.Properties))
				for i, p := range req.Properties {
					fields[i] = graphql.Field{Name: p}
				}
				return fields
			}()...)

		if keyword != "" && keyword != "none" {
			gql = gql.WithNearText(wClient.GraphQL().NearTextArgBuilder().WithConcepts([]string{keyword}))
		}
		gql = gql.WithOffset(offset).WithLimit(limit)

		resp, err := gql.Do(context.Background())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if len(resp.Errors) > 0 {
			var errMsg string
			for _, e := range resp.Errors {
				errMsg += e.Message
			}
			c.JSON(http.StatusBadRequest, gin.H{"error": errMsg})
			return
		}

		// 统计 count
		agg, err := wClient.GraphQL().Aggregate().
			WithClassName(className).
			WithTenant(tenant).
			WithFields(graphql.Field{Name: "meta", Fields: []graphql.Field{{Name: "count"}}}).
			Do(context.Background())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if len(agg.Errors) > 0 {
			var errMsg string
			for _, e := range resp.Errors {
				errMsg += e.Message
			}
			c.JSON(http.StatusBadRequest, gin.H{"error": errMsg})
			return
		}

		// 返回数据
		data := make([]map[string]interface{}, 0)
		if getData, ok := resp.Data["Get"].(map[string]interface{}); ok {
			if classData, ok := getData[className].([]interface{}); ok {
				for _, cd := range classData {
					data = append(data, cd.(map[string]interface{}))
				}
			}
		}

		var count int
		if aggData, ok := agg.Data["Aggregate"].(map[string]interface{}); ok {
			if classAgg, ok := aggData[className].([]interface{}); ok && len(classAgg) > 0 {
				if meta, ok := classAgg[0].(map[string]interface{})["meta"].(map[string]interface{}); ok {
					count = int(meta["count"].(float64))
				}
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"data":  data,
			"count": count,
		})
	}
}

// /tenants/:class_name 路由处理
func TenantHandler(wClient *client.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		className := c.Param("class_name")
		tenants, err := wClient.Schema().TenantsGetter().
			WithClassName(className).
			Do(context.Background())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, tenants)
	}
}
