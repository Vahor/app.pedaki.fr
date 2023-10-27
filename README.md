# app.pedaki.fr

Mark `node_modules/@prisma/client` as non excluded in your IDE to have autocompletion and type safety.

## Cheatsheet

```sh
# Remove all node_mopdules
npx rimraf --glob **/node_modules

# yalc pedaki design
pnpm build --filter design
yalc push ./packages/design/dist
# where you want to use it
yalc add @pedaki/design

# yalc pedaki common
pnpm build --filter common
yalc push ./packages/common/dist
# where you want to use it
yalc add @pedaki/common


# app.pedaki.fr
cd packages/db
npx prisma db push
cd ../..
pnpm build --filter="./packages/*"
pnpm dev
stripe listen --forward-to http://localhost:8080/api/stripe/webhook
```
