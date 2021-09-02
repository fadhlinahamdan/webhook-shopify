'use strict';

// Shopify webhook
import 'isomorphic-fetch';

import Koa from 'koa';
import session from 'koa-session';
import shopifyAuth, {verifyRequest} from '@shopify/koa-shopify-auth';
// Import our package
import {receiveWebhook, registerWebhook} from '@shopify/koa-shopify-webhooks';

const serverless = require('aws-serverless-koa');
const { SHOPIFY_API_KEY, SHOPIFY_SECRET } = process.env;
const app = new Koa();
app.keys = [ SHOPIFY_SECRET ];

app.use(session(app));
app.use(
  shopifyAuth({
    apiKey: SHOPIFY_API_KEY,
    secret: SHOPIFY_SECRET,
    scopes: ['write_orders, write_products'],
    async afterAuth(ctx) {
      const {shop, accessToken} = ctx.session;

      // register a webhook for product creation
      const registration = await registerWebhook({
        // for local dev you probably want ngrok or something similar
        address: 'www.mycool-app.com/webhooks/products/create',
        topic: 'PRODUCTS_CREATE',
        accessToken,
        shop,
        apiVersion: 'unstable',
      });

      if (registration.success) {
        console.log('Successfully registered webhook!');
      } else {
        console.log('Failed to register webhook', registration.result);
      }

      ctx.redirect('/');
    },
  }),
);

app.use(
  // receive webhooks
  receiveWebhook({
    path: '/webhooks/products/create',
    secret: SHOPIFY_SECRET,
    // called when a valid webhook is received
    onReceived(ctx) {
      console.log('received webhook: ', ctx.state.webhook);
    },
  }),
);

app.use(verifyRequest());

app.use((ctx) => {
  ctx.body = 'Hello, world!';
});

module.exports.handler = serverless(app);
