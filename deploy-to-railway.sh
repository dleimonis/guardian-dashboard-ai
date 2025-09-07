#!/bin/bash

# Railway Deployment Script for Guardian Dashboard AI
# MCP Hackathon Submission

echo "🚂 Guardian Dashboard AI - Railway Deployment Script"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
fi

# Function to prompt for environment variables
setup_env_vars() {
    echo -e "${GREEN}Setting up environment variables...${NC}"
    echo ""
    
    # Set basic variables
    railway env:set NODE_ENV=production
    railway env:set PORT=3001
    railway env:set DESCOPE_PROJECT_ID=P31sYu11ghqKWlnCob2qq2n9fvcN
    
    # Optional: Set Descope Management Key
    echo "Do you have a Descope Management Key? (y/n)"
    read -r has_key
    if [ "$has_key" = "y" ]; then
        echo "Enter your Descope Management Key:"
        read -r management_key
        railway env:set DESCOPE_MANAGEMENT_KEY="$management_key"
    else
        echo -e "${YELLOW}Proceeding without Management Key - Demo mode will be active${NC}"
    fi
    
    # Set frontend URL
    echo "Enter your Lovable frontend URL (e.g., https://your-app.lovable.app):"
    read -r frontend_url
    railway env:set FRONTEND_URL="$frontend_url"
    
    echo -e "${GREEN}Environment variables configured!${NC}"
}

# Main deployment process
main() {
    echo "📋 Pre-deployment Checklist:"
    echo "  ✅ GitHub repository ready"
    echo "  ✅ Backend code tested locally"
    echo "  ✅ Railway.json configured"
    echo "  ✅ Demo mode configured for hackathon"
    echo ""
    
    echo "Ready to deploy? (y/n)"
    read -r ready
    
    if [ "$ready" != "y" ]; then
        echo "Deployment cancelled."
        exit 0
    fi
    
    # Login to Railway
    echo -e "${GREEN}Step 1: Logging into Railway...${NC}"
    railway login
    
    # Link to project or create new one
    echo -e "${GREEN}Step 2: Setting up Railway project...${NC}"
    echo "Do you have an existing Railway project? (y/n)"
    read -r has_project
    
    if [ "$has_project" = "y" ]; then
        railway link
    else
        echo "Enter a name for your project (e.g., guardian-dashboard-backend):"
        read -r project_name
        railway init -n "$project_name"
    fi
    
    # Setup environment variables
    echo -e "${GREEN}Step 3: Configuring environment...${NC}"
    setup_env_vars
    
    # Deploy
    echo -e "${GREEN}Step 4: Deploying to Railway...${NC}"
    cd backend || exit
    railway up
    
    # Get deployment URL
    echo -e "${GREEN}Step 5: Getting deployment URL...${NC}"
    railway domain
    
    echo ""
    echo "=================================================="
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo "=================================================="
    echo ""
    echo "Next Steps:"
    echo "1. Copy your Railway URL from above"
    echo "2. Update your Lovable frontend with the backend URL"
    echo "3. Test the emergency simulation feature"
    echo "4. Submit to the hackathon!"
    echo ""
    echo -e "${YELLOW}Demo Mode Status:${NC}"
    if [ -z "$management_key" ]; then
        echo "✅ Demo mode ACTIVE - No API keys required!"
        echo "✅ Perfect for hackathon testing"
    else
        echo "✅ Production mode with Descope integration"
    fi
    echo ""
    echo "Good luck with the hackathon! 🚀"
}

# Run the script
main