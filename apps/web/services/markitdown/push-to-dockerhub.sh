#!/bin/bash
# ============================================================================
# Push MarkItDown Service to Docker Hub
# ============================================================================
# Usage: ./push-to-dockerhub.sh [DOCKERHUB_USERNAME] [VERSION]
# Example: ./push-to-dockerhub.sh myusername 1.0.0
# ============================================================================

set -e

# Configuration
DOCKERHUB_USERNAME="${1}"
VERSION="${2:-1.0.0}"
IMAGE_NAME="markitdown-service"
LATEST_TAG="latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validation
if [ -z "$DOCKERHUB_USERNAME" ]; then
    echo -e "${RED}Error: Docker Hub username required${NC}"
    echo "Usage: ./push-to-dockerhub.sh [DOCKERHUB_USERNAME] [VERSION]"
    echo "Example: ./push-to-dockerhub.sh johndoe 1.0.0"
    exit 1
fi

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Docker Hub Push Script${NC}"
echo -e "${GREEN}======================================${NC}"
echo "Docker Hub Username: $DOCKERHUB_USERNAME"
echo "Image Name: $IMAGE_NAME"
echo "Version: $VERSION"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed${NC}"

# Check if user is logged in to Docker Hub
echo -e "${YELLOW}Checking Docker Hub login...${NC}"
if ! docker info | grep -q "Username"; then
    echo -e "${YELLOW}Not logged in to Docker Hub. Logging in...${NC}"
    docker login
else
    echo -e "${GREEN}✓ Already logged in to Docker Hub${NC}"
fi

# Build the Docker image
echo ""
echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t $IMAGE_NAME:$VERSION .

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Docker build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker image built successfully${NC}"

# Tag images for Docker Hub
echo ""
echo -e "${YELLOW}Tagging images for Docker Hub...${NC}"

# Tag with version
docker tag $IMAGE_NAME:$VERSION $DOCKERHUB_USERNAME/$IMAGE_NAME:$VERSION
echo -e "${GREEN}✓ Tagged: $DOCKERHUB_USERNAME/$IMAGE_NAME:$VERSION${NC}"

# Tag as latest
docker tag $IMAGE_NAME:$VERSION $DOCKERHUB_USERNAME/$IMAGE_NAME:$LATEST_TAG
echo -e "${GREEN}✓ Tagged: $DOCKERHUB_USERNAME/$IMAGE_NAME:$LATEST_TAG${NC}"

# Push to Docker Hub
echo ""
echo -e "${YELLOW}Pushing to Docker Hub...${NC}"

# Push version tag
echo -e "${YELLOW}Pushing version $VERSION...${NC}"
docker push $DOCKERHUB_USERNAME/$IMAGE_NAME:$VERSION

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to push version tag${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Pushed: $DOCKERHUB_USERNAME/$IMAGE_NAME:$VERSION${NC}"

# Push latest tag
echo -e "${YELLOW}Pushing latest tag...${NC}"
docker push $DOCKERHUB_USERNAME/$IMAGE_NAME:$LATEST_TAG

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to push latest tag${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Pushed: $DOCKERHUB_USERNAME/$IMAGE_NAME:$LATEST_TAG${NC}"

# Success summary
echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}✓ SUCCESS! Images pushed to Docker Hub${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "Your images are now available:"
echo "  - $DOCKERHUB_USERNAME/$IMAGE_NAME:$VERSION"
echo "  - $DOCKERHUB_USERNAME/$IMAGE_NAME:$LATEST_TAG"
echo ""
echo "To pull and run:"
echo "  docker pull $DOCKERHUB_USERNAME/$IMAGE_NAME:latest"
echo "  docker run -p 5100:5100 -e HOST=0.0.0.0 $DOCKERHUB_USERNAME/$IMAGE_NAME:latest"
echo ""
echo "Docker Hub URL:"
echo "  https://hub.docker.com/r/$DOCKERHUB_USERNAME/$IMAGE_NAME"
echo ""
