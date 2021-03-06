import ctor from 'bet-ctor';
import seed from 'bet-seed';
import Logger from 'bet-logger';
// import apiEdge from 'bet-api-edge';
// import apiOpera from 'bet-api-opera';
import apiChrome from 'bet-api-chrome';
// import apiSafari from 'bet-api-safari';
// import apiFirefox from 'bet-api-firefox';
import BetMessenger from 'bet-messenger';


const log = new Logger(`BET:talker:${seed}`);

export default class Talker extends BetMessenger {
  constructor (appId) {
    log('constructor', appId);

    super(appId);
    this.cid = 1;

    switch (ENV_BROWSER) {
      // case 'edge':
      //   this.api = apiEdge;
      //   break;
      // case 'opera':
      //   this.api = apiOpera;
      //   break;
      case 'chrome':
        this.api = apiChrome;
        break;
      // case 'safari':
      //   this.api = apiSafari;
      //   break;
      // case 'firefox':
      //   this.api = apiFirefox;
      //   break;
    }

    this.ready = false;
    this.answers = ctor.object();
    this.onReadyCbs = ctor.object();
  }

  send (msg, cb) {
    msg.cid = this.cid++;
    msg.ext = this.appId;
    msg.host = window.document.location.hostname;
    msg.url = window.document.location.href;
    msg.isFrame = (window !== top);

    log('send', msg);

    super.send(msg, cb);
  }

  sendAnswer (message, sender, sendResponse) {
    log('sendAnswer ', message, sender);

    if (this.ready) {
      log('sendAnswer Talker is ready');

      return this.answerByReason(message, sender, sendResponse);
    }

    this.onReadyCbs[`${this.appId}${this.cid}`] = () => {
      log(`sendAnswer when Talker set ready with cb key: ${this.appId}${this.cid}`);

      return this.answerByReason(message, sender, sendResponse);
    }
  }

  answerByReason (message, sender, sendResponse) {
    log('answerByReason %s', message.reason);
    if (!message.reason) {
      return this.sendUnauthorized(sendResponse);
    }

    switch (message.reason) {
      case 'get.modules':
        this.sendModulesByProps(message, sender, sendResponse);
        break;
      case 'set.brexls':
        let setKey = this.appId + message.data.key;
        this.api.localStorage.set(setKey, message.data.value);
        sendResponse({value: 'ok'});
        break;
      case 'get.brexls':
        let getKey = this.appId + message.data.key;
        let response = this.api.localStorage.get(getKey);
        sendResponse({value: response});
        break;
      case 'get.ajax':
        this.api.ajax.get(message.data, sendResponse);
        break;
      case 'post.ajax':
        this.api.ajax.post(message.data, sendResponse);
        break;
      case 'head.ajax':
        this.api.ajax.head(message.data, sendResponse);
        break;
      case 'ajax.ajax':
        this.api.ajax.ajax(message.data, sendResponse);
        break;
      default:
        if (this.answers[message.reason] && 'function' === typeof this.answers[message.reason]) {
          return this.answers[message.reason](message, sender, sendResponse);
        }
        this.sendUnauthorized(sendResponse);
        break;
    }
  }

  sendUnauthorized (sendResponse) {
    sendResponse({err: true, value: 'Unauthorized'});
  }

  sendModulesByProps (message, sender, sendResponse) {
    log('sendModulesByProps');

    let response = {
      '0': ctor.array(ctor.array(), ctor.array(), ctor.array()),
      '1': ctor.array(ctor.array(), ctor.array(), ctor.array()),
      '2': ctor.array(ctor.array(), ctor.array(), ctor.array()),
      'x': ctor.array(ctor.array(), ctor.array(), ctor.array())
    };

    let [key, ...modules] = this.cfg.raw;


    modules.forEach((m) => {
      log(m);

      this.beforeTestE(m, message, response);
    });

    sendResponse({value: response});
  }

  beforeTestE (module, message, response) {
    if (module.e) {
      log(`Before Test E: passed`);

      this.testE(module, message, response);
    } else {
      log(`Before Test E: failed`);

      this.beforeTestI(module, message, response);
    }
  }

  beforeTestI (module, message, response) {
    if (module.i) {
      log(`Before Test I: passed`);

      this.testI(module, message, response);
    } else {
      log(`Before Test I: failed`);

      this.testH(module, message, response);
    }
  }

  testE (module, message, response) {
    let re = ctor.regExp(module.e);

    log(`Test E: ${re} ! ${message.host}`);

    if (!re.test(message.host)) {
      log(`Test E passed`);

      this.beforeTestI(module, message, response);
    }

    log(`Test E falied`);
  }

  testI (module, message, response) {
    let re = ctor.regExp(module.i);

    log(`Test I: ${re} ! ${message.url}`);

    if (!ctor.regExp(module.i).test(message.url)) {
      log(`Test I passed`);

      this.testH(module, message, response);
    }

    log(`Test I falied`);
  }

  testH (module, message, response) {
    let re = ctor.regExp(module.h);

    log(`Test H: ${re} = ${message.host}`);

    if (ctor.regExp(module.h).test(message.host)) {
      log(`Test H passed`);

      this.testF(module, message, response);
    }

    log(`Test H falied`);
  }

  testF (module, message, response) {
    log(`Test F: Is frame?`);

    if (message.isFrame) {
      log(`Test F: frame : ${message.isFrame}`);

      if (module.f === 1 || module.f === 2) {
        this.assemblingModules(module, response);
      }
    } else {
      log(`Test F: frame : ${message.isFrame}`);

      if (module.f === 0 || module.f === 1) {
        this.assemblingModules(module, response);
      }
    }
  }

  assemblingModules (module, response) {
    log(`assemblingModules`);

    module.l.forEach((name) => {
      if (this.modules[name]) {
        if (module.r === 'x') {
          log(`Added module [${name}] to { "${module.r}" : [${module.a}] with delay = ${module.d}}`);

          response[module.r][module.a].push(ctor.array(module.d, this.modules[name]));
        } else {
          log(`Added module [${name}] to { "${module.r}" : [${module.a}] }`);

          response[module.r][module.a].push(this.modules[name]);
        }
      }
    });
  }
}
