FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    && python3 -m pip install --user yt-dlp \
    && echo 'export PATH="/root/.local/bin:$PATH"' >> /root/.bashrc

# Set working directory
WORKDIR /app

# Add yt-dlp to PATH
ENV PATH="/root/.local/bin:$PATH"

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create tmp directory
RUN mkdir -p tmp

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "start"]
