// @ts-check
const {
  test
} = require('@playwright/test');
const fs = require('fs');
const {
  default: Ajv
} = require('ajv');
const ajv = new Ajv({
  allErrors: true
});

const schema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Generated schema for Root",
  "type": "object",
  "properties": {
    "service": {
      "type": "string",
      "minLength": 1,
    },
    "desc": {
      "type": "string",
      "minLength": 1,
    },
    "reason": {
      "type": "string"
    },
    "amount_billed": {
      "type": "string",
      "pattern": "\$\d"
    },
    "plan_discount": {
      "type": "string",
      "pattern": "\$\d"
    },
    "plan_paid": {
      "type": "string",
      "pattern": "\$\d"
    },
    "copay": {
      "type": "string",
      "pattern": "\$\d"
    },
    "coinsurance": {
      "type": "string",
      "pattern": "\$\d"
    },
    "deductible": {
      "type": "string",
      "pattern": "\$\d"
    },
    "non_covered": {
      "type": "string",
      "pattern": "\$\d"
    },
    "provider_name": {
      "type": "string",
      "minLength": 1
    },
    "claim_number": {
      "type": "string",
      "minLength": 10,
    },
    "patient_name": {
      "type": "string",
      "minLength": 1
    },
    "date_of_service": {
      "type": "string",
      "pattern": "\d\d\/\d\d\/\d\d\d\d"
    },
    "date_received": {
      "type": "string",
      "pattern": "\d\d\/\d\d\/\d\d\d\d"
    },
    "status": {
      "type": "string",
      "minLength": 1
    },
    "status_updated": {
      "type": "string",
      "pattern": "\d\d\/\d\d\/\d\d\d\d"
    },
    "claim_amount_billed": {
      "type": "string",
      "pattern": "\$\d"
    },
    "claim_amount_discount": {
      "type": "string",
      "pattern": "\$\d"
    },
    "claim_amount_plan_paid": {
      "type": "string",
      "pattern": "\$\d"
    },
    "claim_amount_owned": {
      "type": "string",
      "pattern": "\$\d"
    }
  },
  "required": [
    "service",
    "desc",
    "amount_billed",
    "plan_discount",
    "plan_paid",
    "copay",
    "coinsurance",
    "deductible",
    "non_covered",
    "provider_name",
    "claim_number",
    "patient_name",
    "date_of_service",
    "date_received",
    "status",
    "status_updated",
    "claim_amount_billed",
    "claim_amount_discount",
    "claim_amount_plan_paid",
    "claim_amount_owned"
  ]
}
const validateClaim = ajv.compile(schema)

test('UHC', async ({
  page,
  context
}) => {
  // --- sign in
  await page.goto('https://member.uhc.com/myuhc');
  await page.locator('#signInButton').click();
  await page.locator('#username').fill(process.env.USER);
  await page.locator('#password').fill(process.env.PASS);
  await page.locator('#submitBtn').click()
  await page.waitForSelector('[href="https://member.uhc.com/claims-and-accounts/claims?locale=en-US"]');

  // --- claims list
  await page.locator('[href="https://member.uhc.com/claims-and-accounts/claims?locale=en-US"]').click()
  await page.waitForSelector('[data-testid="toggle-to-infinite-scroll"]');
  await page.locator('[data-testid="toggle-to-infinite-scroll"]').click();
  // https://member.uhc.com/claims-and-accounts/claims

  await page.waitForTimeout(10000);


  const links = await page.evaluate(() => Array.from(document.querySelectorAll('a[data-testid="claim-view-details-button"]')).map(el => el.href));
  console.log(`Found ${links.length} claims.`);

  async function scrapeClaim(link) {
    await page.goto(link);
    await page.waitForSelector('*[data-testid="claim-details-services-line-item-field-plan-paid"]');

    const providerName = await page.evaluate(() => Array.from(document.querySelectorAll('*[data-testid="claim-details-summary-provider-name"]')).map(el => el.innerText)[0]);
    const claimNumber = await page.evaluate(() => Array.from(document.querySelectorAll('*[data-testid="claim-details-summary-claim-type-and-number"]')).map(el => el.innerText)[0].replace('Medical Claim #', '').trim());
    const details = await page.evaluate(() => Array.from(document.querySelectorAll('*[data-testid="claim-details-summary-info"]')).map(el => el.innerText).join().split('\n'));
    const amounts = await page.evaluate(() => Array.from(document.querySelectorAll('*[data-testid="claim-details-breakdown-line-item-amount"]')).map(el => el.innerText).map(str => str.split('\n')));
    const billed = await page.evaluate(() => Array.from(document.querySelectorAll('*[data-testid="claim-details-services-line-item-field-amount-billed"]')).map(el => el.innerText));
    const discount = await page.evaluate(() => Array.from(document.querySelectorAll('*[data-testid="claim-details-services-line-item-field-plan-discount"]')).map(el => el.innerText));
    const paid = await page.evaluate(() => Array.from(document.querySelectorAll('*[data-testid="claim-details-services-line-item-field-plan-paid"]')).map(el => el.innerText));
    const copay = await page.evaluate(() => Array.from(document.querySelectorAll('*[data-testid="claim-details-services-line-item-field-copay"]')).map(el => el.innerText));
    const coinsurance = await page.evaluate(() => Array.from(document.querySelectorAll('*[data-testid="claim-details-services-line-item-field-coinsurance"]')).map(el => el.innerText));
    const deductible = await page.evaluate(() => Array.from(document.querySelectorAll('*[data-testid="claim-details-services-line-item-field-deductible"]')).map(el => el.innerText));
    const noncovered = await page.evaluate(() => Array.from(document.querySelectorAll('*[data-testid="claim-details-services-line-item-field-noncovered"]')).map(el => el.innerText));

    const itemService = await page.evaluate(() => Array.from(document.querySelectorAll('*[data-testid="claim-details-services-line-item-field-provided-service"]')).map(el => el.innerText.replace(/\n.*$/, '')));
    const itemDesc = await page.evaluate(() => Array.from(document.querySelectorAll('*[data-testid="claim-details-services-line-item-field-service-description"]')).map(el => el.innerText.replace('Service Description:\n', '')));
    const deniedBecause = await page.evaluate(() => Array.from(document.querySelectorAll('*[data-testid="claim-details-services-line-item-field-claim-codes"]')).map(el => el.innerText.replace('Claim Codes:\n', '')));

    const lineItems = billed.map((_, i) => ({
      'service': itemService[i],
      desc: itemDesc[i],
      reason: deniedBecause[i],
      'amount_billed': billed[i],
      "plan_discount": discount[i],
      'plan_paid': paid[i],
      'copay': copay[i],
      'coinsurance': coinsurance[i],
      'deductible': deductible[i],
      'non_covered': noncovered[i],
      provider_name: providerName,
      claim_number: claimNumber,
      patient_name: details[1],
      date_of_service: details[3],
      date_received: details[5],
      status: details[7],
      status_updated: details[8].replace('- ', ''),
      claim_amount_billed: amounts[0][1],
      claim_amount_discount: amounts[1][1],
      claim_amount_plan_paid: amounts[2][1],
      claim_amount_owned: amounts[3][1],
    }))

    lineItems.map(validateClaim).forEach(item => {
      if (item.errors) {
        console.warn(`Bad data:${item.errors}\n${JSON.stringify(item,null, 2)}`);
        item.errors = undefined;
      }
    })
    console.log(lineItems);
    return lineItems;
  }

  const claims = [];
  for (var i = 0; i < links.length; i++) {
    claims.push(
      await scrapeClaim(links[i])
    );
  }

  fs.writeFileSync('./claim.json', JSON.stringify(claims.flat(), null, 2));
});