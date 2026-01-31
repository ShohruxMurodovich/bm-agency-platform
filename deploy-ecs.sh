#!/bin/bash
set -e

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BACKEND_REPO="bm-agency-backend"
FRONTEND_REPO="bm-agency-frontend"

echo "🚀 Deploying BM Agency Platform to AWS ECS Fargate"
echo "=================================================="
echo "AWS Account: $AWS_ACCOUNT_ID"
echo "Region: $AWS_REGION"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Create ECR repositories if they don't exist
echo -e "${YELLOW}Step 1: Setting up ECR repositories...${NC}"
aws ecr describe-repositories --repository-names $BACKEND_REPO --region $AWS_REGION 2>/dev/null || \
  aws ecr create-repository --repository-name $BACKEND_REPO --region $AWS_REGION
aws ecr describe-repositories --repository-names $FRONTEND_REPO --region $AWS_REGION 2>/dev/null || \
  aws ecr create-repository --repository-name $FRONTEND_REPO --region $AWS_REGION
echo -e "${GREEN}✓ ECR repositories ready${NC}"

# Step 2: Login to ECR
echo -e "${YELLOW}Step 2: Logging into ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
echo -e "${GREEN}✓ Logged into ECR${NC}"

# Step 3: Build and push backend
echo -e "${YELLOW}Step 3: Building and pushing backend...${NC}"
cd server
docker build -t $BACKEND_REPO:latest .
docker tag $BACKEND_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BACKEND_REPO:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BACKEND_REPO:latest
cd ..
echo -e "${GREEN}✓ Backend pushed to ECR${NC}"

# Step 4: Build and push frontend
echo -e "${YELLOW}Step 4: Building and pushing frontend...${NC}"
cd client
docker build -t $FRONTEND_REPO:latest .
docker tag $FRONTEND_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO:latest
cd ..
echo -e "${GREEN}✓ Frontend pushed to ECR${NC}"

# Step 5: Update task definitions
echo -e "${YELLOW}Step 5: Updating task definitions...${NC}"
sed -i.bak "s/YOUR_ACCOUNT_ID/$AWS_ACCOUNT_ID/g" aws/backend-task-definition.json
sed -i.bak "s/REGION/$AWS_REGION/g" aws/backend-task-definition.json
sed -i.bak "s/YOUR_ACCOUNT_ID/$AWS_ACCOUNT_ID/g" aws/frontend-task-definition.json
sed -i.bak "s/REGION/$AWS_REGION/g" aws/frontend-task-definition.json
echo -e "${GREEN}✓ Task definitions updated${NC}"

# Step 6: Register task definitions
echo -e "${YELLOW}Step 6: Registering task definitions...${NC}"
aws ecs register-task-definition --cli-input-json file://aws/backend-task-definition.json --region $AWS_REGION
aws ecs register-task-definition --cli-input-json file://aws/frontend-task-definition.json --region $AWS_REGION
echo -e "${GREEN}✓ Task definitions registered${NC}"

# Step 7: Update services (if they exist)
echo -e "${YELLOW}Step 7: Updating ECS services...${NC}"
if aws ecs describe-services --cluster bm-agency-cluster --services bm-backend-service --region $AWS_REGION 2>/dev/null | grep -q "bm-backend-service"; then
  aws ecs update-service --cluster bm-agency-cluster --service bm-backend-service --force-new-deployment --region $AWS_REGION
  echo -e "${GREEN}✓ Backend service updated${NC}"
else
  echo -e "${YELLOW}⚠ Backend service not found. Create it manually in AWS Console.${NC}"
fi

if aws ecs describe-services --cluster bm-agency-cluster --services bm-frontend-service --region $AWS_REGION 2>/dev/null | grep -q "bm-frontend-service"; then
  aws ecs update-service --cluster bm-agency-cluster --service bm-frontend-service --force-new-deployment --region $AWS_REGION
  echo -e "${GREEN}✓ Frontend service updated${NC}"
else
  echo -e "${YELLOW}⚠ Frontend service not found. Create it manually in AWS Console.${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Check ECS Console for service status"
echo "2. Get Load Balancer URL from ECS Console"
echo "3. Test your application"
