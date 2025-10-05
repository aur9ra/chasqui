echo build-md: tsc -p tsconfig.scripts.json
tsc -p tsconfig.scripts.json
echo build-md: node build-md/build-md.js
node build-md/build-md.js
