// ruleFactory.js

export function getRulesModule(env = 'pc') {
  let module;

  if (env === 'mobile') {
    module = require('./rulesConfig.vant.js');
  } else {
    module = require('./rulesConfig.ele.js');
  }

  return module;
}
