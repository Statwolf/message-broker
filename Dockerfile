from node:14.15.1-slim

add package.json /source/package.json
add package-lock.json /source/package-lock.json
run cd /source && npm install

add index.js /source/index.js
add webpack.config.js /source/webpack.config.js
add src /source/src
run cd /source && npm run build && mv dist /app && cd / && rm -rfv /source

expose 9999
cmd cd /app && node ./app.bundle.js
