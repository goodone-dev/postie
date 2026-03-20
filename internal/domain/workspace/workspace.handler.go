package workspace

import "github.com/gin-gonic/gin"

type WorkspaceHandler interface {
	Create(c *gin.Context)
	Get(c *gin.Context)
	Update(c *gin.Context)
	Delete(c *gin.Context)
	List(c *gin.Context)
}
