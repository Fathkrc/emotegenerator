# frontend/Dockerfile

# Use a small Nginx image
FROM nginx:alpine

# Copy the built frontend files into the nginx html directory
COPY dist/ /usr/share/nginx/html

# (Optional but good) Copy a custom nginx config to allow React routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
