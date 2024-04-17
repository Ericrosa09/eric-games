function createunityinstance(e,t,r){function n(e,r){if(!n.aborted&&t.showbanner)return"error"==r&&(n.aborted=!0),t.showbanner(e,r);switch(r){case"error":console.error(e);break;case"warning":console.warn(e);break;default:console.log(e)}}function o(e){var t=e.reason||e.error,r=t?t.tostring():e.message||e.reason||"",n=t&&t.stack?t.stack.tostring():"";if(n.startswith(r)&&(n=n.substring(r.length)),r+="\n"+n.trim(),r&&c.stacktraceregexp&&c.stacktraceregexp.test(r)){var o=e.filename||t&&(t.filename||t.sourceurl)||"",a=e.lineno||t&&(t.linenumber||t.line)||0;s(r,o,a)}}function a(e){e.preventdefault()}function s(e,t,r){if(e.indexof("fullscreen error")==-1){if(c.startuperrorhandler)return void c.startuperrorhandler(e,t,r);if(!(c.errorhandler&&c.errorhandler(e,t,r)||(console.log("invoking error handler due to\n"+e),"function"==typeof dump&&dump("invoking error handler due to\n"+e),s.didshowerrormessage))){var e="an error occurred running the unity content on this page. see your browser javascript console for more info. the error was:\n"+e;e.indexof("disable_exception_catching")!=-1?e="an exception has occurred, but exception handling has been disabled in this build. if you are the developer of this content, enable exceptions in your project webgl player settings to be able to catch the exception or see the stack trace.":e.indexof("cannot enlarge memory arrays")!=-1?e="out of memory. if you are the developer of this content, try allocating more memory to your webgl build in the webgl player settings.":e.indexof("invalid array buffer length")==-1&&e.indexof("invalid typed array length")==-1&&e.indexof("out of memory")==-1&&e.indexof("could not allocate memory")==-1||(e="the browser could not allocate enough memory for the webgl content. if you are the developer of this content, try allocating less memory to your webgl build in the webgl player settings."),alert(e),s.didshowerrormessage=!0}}}function i(e,t){if("symbolsurl"!=e){var n=c.downloadprogress[e];n||(n=c.downloadprogress[e]={started:!1,finished:!1,lengthcomputable:!1,total:0,loaded:0}),"object"!=typeof t||"progress"!=t.type&&"load"!=t.type||(n.started||(n.started=!0,n.lengthcomputable=t.lengthcomputable),n.total=t.total,n.loaded=t.loaded,"load"==t.type&&(n.finished=!0));var o=0,a=0,s=0,i=0,d=0;for(var e in c.downloadprogress){var n=c.downloadprogress[e];if(!n.started)return 0;s++,n.lengthcomputable?(o+=n.loaded,a+=n.total,i++):n.finished||d++}var u=s?(s-d-(a?i*(a-o)/a:0))/s:0;r(.9*u)}}function d(e){i(e);var t=c.cachecontrol(c[e]),r=c.companyname&&c.productname?c.cachedfetch:c.fetchwithprogress,o=c[e],a=/file:\/\//.exec(o)?"same-origin":void 0,s=r(c[e],{method:"get",companyname:c.companyname,productname:c.productname,control:t,mode:a,onprogress:function(t){i(e,t)}});return s.then(function(e){return e.parsedbody}).catch(function(t){var r="failed to download file "+c[e];"file:"==location.protocol?n(r+". loading web pages via a file:// url without a web server is not supported by this browser. please use a local development web server to host unity content, or use the unity build and run option.","error"):console.error(r)})}function u(){return new promise(function(e,t){var r=document.createelement("script");r.src=c.frameworkurl,r.onload=function(){if("undefined"==typeof unityframework||!unityframework){var t=[["br","br"],["gz","gzip"]];for(var o in t){var a=t[o];if(c.frameworkurl.endswith("."+a[0])){var s="unable to parse "+c.frameworkurl+"!";if("file:"==location.protocol)return void n(s+" loading pre-compressed (brotli or gzip) content via a file:// url without a web server is not supported by this browser. please use a local development web server to host compressed unity content, or use the unity build and run option.","error");if(s+=' this can happen if build compression was enabled but web server hosting the content was misconfigured to not serve the file with http response header "content-encoding: '+a[1]+'" present. check browser console and devtools network tab to debug.',"br"==a[0]&&"http:"==location.protocol){var i=["localhost","127.0.0.1"].indexof(location.hostname)!=-1?"":"migrate your server to use https.";s=/firefox/.test(navigator.useragent)?"unable to parse "+c.frameworkurl+'!<br>if using custom web server, verify that web server is sending .br files with http response header "content-encoding: br". brotli compression may not be supported in firefox over http connections. '+i+' see <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1670675">https://bugzilla.mozilla.org/show_bug.cgi?id=1670675</a> for more information.':"unable to parse "+c.frameworkurl+'!<br>if using custom web server, verify that web server is sending .br files with http response header "content-encoding: br". brotli compression may not be supported over http connections. migrate your server to use https.'}return void n(s,"error")}}n("unable to parse "+c.frameworkurl+"! the file is corrupt, or compression was misconfigured? (check content-encoding http response header on web server)","error")}var d=unityframework;unityframework=null,r.onload=null,e(d)},r.onerror=function(e){n("unable to load file "+c.frameworkurl+"! check that the file exists on the remote server. (also check browser console and devtools network tab to debug)","error")},document.body.appendchild(r),c.deinitializers.push(function(){document.body.removechild(r)})})}function l(){u().then(function(e){e(c)});var e=d("dataurl");c.prerun.push(function(){c.addrundependency("dataurl"),e.then(function(e){var t=new dataview(e.buffer,e.byteoffset,e.bytelength),r=0,n="unitywebdata1.0\0";if(!string.fromcharcode.apply(null,e.subarray(r,r+n.length))==n)throw"unknown data format";r+=n.length;var o=t.getuint32(r,!0);for(r+=4;r<o;){var a=t.getuint32(r,!0);r+=4;var s=t.getuint32(r,!0);r+=4;var i=t.getuint32(r,!0);r+=4;var d=string.fromcharcode.apply(null,e.subarray(r,r+i));r+=i;for(var u=0,l=d.indexof("/",u)+1;l>0;u=l,l=d.indexof("/",u)+1)c.fs_createpath(d.substring(0,u),d.substring(u,l-1),!0,!0);c.fs_createdatafile(d,null,e.subarray(a,a+s),!0,!0,!0)}c.removerundependency("dataurl")})})}r=r||function(){};var c={canvas:e,webglcontextattributes:{preservedrawingbuffer:!1},cachecontrol:function(e){return e==c.dataurl?"must-revalidate":"no-store"},streamingassetsurl:"streamingassets",downloadprogress:{},deinitializers:[],intervals:{},setinterval:function(e,t){var r=window.setinterval(e,t);return this.intervals[r]=!0,r},clearinterval:function(e){delete this.intervals[e],window.clearinterval(e)},prerun:[],postrun:[],print:function(e){console.log(e)},printerr:function(e){console.error(e),"string"==typeof e&&e.indexof("wasm streaming compile failed")!=-1&&(e.tolowercase().indexof("mime")!=-1?n('http response header "content-type" configured incorrectly on the server for file '+c.codeurl+' , should be "application/wasm". startup time performance will suffer.',"warning"):n('webassembly streaming compilation failed! this can happen for example if "content-encoding" http header is incorrectly enabled on the server for file '+c.codeurl+", but the file is not pre-compressed on disk (or vice versa). check the network tab in browser devtools to debug server header configuration.","warning"))},locatefile:function(e){return"build.wasm"==e?this.codeurl:e},disabledcanvasevents:["contextmenu","dragstart"]};for(var h in t)c[h]=t[h];c.streamingassetsurl=new url(c.streamingassetsurl,document.url).href;var f=c.disabledcanvasevents.slice();f.foreach(function(t){e.addeventlistener(t,a)}),window.addeventlistener("error",o),window.addeventlistener("unhandledrejection",o),c.deinitializers.push(function(){c.disableaccesstomediadevices(),f.foreach(function(t){e.removeeventlistener(t,a)}),window.removeeventlistener("error",o),window.removeeventlistener("unhandledrejection",o);for(var t in c.intervals)window.clearinterval(t);c.intervals={}}),c.quitcleanup=function(){for(var e=0;e<c.deinitializers.length;e++)c.deinitializers[e]();c.deinitializers=[],"function"==typeof c.onquit&&c.onquit()};var p="",g="";document.addeventlistener("webkitfullscreenchange",function(t){var r=document.webkitcurrentfullscreenelement;r===e?e.style.width&&(p=e.style.width,g=e.style.height,e.style.width="100%",e.style.height="100%"):p&&(e.style.width=p,e.style.height=g,p="",g="")});var m={module:c,setfullscreen:function(){return c.setfullscreen?c.setfullscreen.apply(c,arguments):void c.print("failed to set fullscreen mode: player not loaded yet.")},sendmessage:function(){return c.sendmessage?c.sendmessage.apply(c,arguments):void c.print("failed to execute sendmessage: player not loaded yet.")},quit:function(){return new promise(function(e,t){c.shouldquit=!0,c.onquit=e})}};return c.systeminfo=function(){function e(e,t,r){return e=regexp(e,"i").exec(t),e&&e[r]}for(var t,r,n,o,a,s,i=navigator.useragent+" ",d=[["firefox","firefox"],["opr","opera"],["edg","edge"],["samsungbrowser","samsung browser"],["trident","internet explorer"],["msie","internet explorer"],["chrome","chrome"],["crios","chrome on ios safari"],["fxios","firefox on ios safari"],["safari","safari"]],u=0;u<d.length;++u)if(r=e(d[u][0]+"[/ ](.*?)[ \\)]",i,1)){t=d[u][1];break}"safari"==t&&(r=e("version/(.*?) ",i,1)),"internet explorer"==t&&(r=e("rv:(.*?)\\)? ",i,1)||r);for(var l=[["windows (.*?)[;)]","windows"],["android ([0-9_.]+)","android"],["iphone os ([0-9_.]+)","iphoneos"],["ipad.*? os ([0-9_.]+)","ipados"],["freebsd( )","freebsd"],["openbsd( )","openbsd"],["linux|x11()","linux"],["mac os x ([0-9_.]+)","macos"],["bot|google|baidu|bing|msn|teoma|slurp|yandex","search bot"]],c=0;c<l.length;++c)if(o=e(l[c][0],i,1)){n=l[c][1],o=o.replace(/_/g,".");break}var h={"nt 5.0":"2000","nt 5.1":"xp","nt 5.2":"server 2003","nt 6.0":"vista","nt 6.1":"7","nt 6.2":"8","nt 6.3":"8.1","nt 10.0":"10"};o=h[o]||o,a=document.createelement("canvas"),a&&(gl=a.getcontext("webgl2"),glversion=gl?2:0,gl||(gl=a&&a.getcontext("webgl"))&&(glversion=1),gl&&(s=gl.getextension("webgl_debug_renderer_info")&&gl.getparameter(37446)||gl.getparameter(7937)));var f="undefined"!=typeof sharedarraybuffer,p="object"==typeof webassembly&&"function"==typeof webassembly.compile;return{width:screen.width,height:screen.height,useragent:i.trim(),browser:t||"unknown browser",browserversion:r||"unknown version",mobile:/mobile|android|ip(ad|hone)/.test(navigator.appversion),os:n||"unknown os",osversion:o||"unknown os version",gpu:s||"unknown gpu",language:navigator.userlanguage||navigator.language,haswebgl:glversion,hascursorlock:!!document.body.requestpointerlock,hasfullscreen:!!document.body.requestfullscreen||!!document.body.webkitrequestfullscreen,hasthreads:f,haswasm:p,haswasmthreads:!1}}(),c.aborthandler=function(e){return s(e,"",0),!0},error.stacktracelimit=math.max(error.stacktracelimit||0,50),c.fetchwithprogress=function(){function e(e,t){if(!t)return 0;var r=e.headers.get("content-encoding"),n=parseint(e.headers.get("content-length"));switch(r){case"br":return math.round(5*n);case"gzip":return math.round(4*n);default:return n}}function t(t,r){var n=function(){};return r&&r.onprogress&&(n=r.onprogress),fetch(t,r).then(function(t){function r(){return"undefined"==typeof a?t.arraybuffer().then(function(e){return n({type:"progress",total:e.length,loaded:0,lengthcomputable:s}),new uint8array(e)}):a.read().then(function(e){return e.done?o():(l+e.value.length<=d.length?(d.set(e.value,l),c=l+e.value.length):u.push(e.value),l+=e.value.length,n({type:"progress",total:math.max(i,l),loaded:l,lengthcomputable:s}),r())})}function o(){if(l===i)return d;if(l<i)return d.slice(0,l);var e=new uint8array(l);e.set(d,0);for(var t=c,r=0;r<u.length;++r)e.set(u[r],t),t+=u[r].length;return e}var a="undefined"!=typeof t.body?t.body.getreader():void 0,s="undefined"!=typeof t.headers.get("content-length"),i=e(t,s),d=new uint8array(i),u=[],l=0,c=0;return s||console.warn("[unitycache] response is served without content-length header. please reconfigure server to include valid content-length for better download performance."),r().then(function(e){return n({type:"load",total:e.length,loaded:e.length,lengthcomputable:s}),t.parsedbody=e,t})})}return t}(),c.unitycache=function(){function e(){function e(e){var t=e.target.result;if(t.objectstorenames.contains(n.name)||t.createobjectstore(n.name),!t.objectstorenames.contains(r.name)){var o=t.createobjectstore(r.name,{keypath:"url"});["version","company","product","updated","revalidated","accessed"].foreach(function(e){o.createindex(e,e)})}}var a=this;a.isconnected=new promise(function(r,n){function s(){a.opendbtimeout&&(cleartimeout(a.opendbtimeout),a.opendbtimeout=null)}try{a.opendbtimeout=settimeout(function(){"undefined"==typeof a.database&&n(new error("could not connect to database: timeout."))},2e3);var i=o.open(t.name,t.version);i.onupgradeneeded=function(t){e(t)},i.onsuccess=function(e){s(),a.database=e.target.result,r()},i.onerror=function(e){s(),a.database=null,n(new error("could not connect to database."))}}catch(e){s(),a.database=null,n(new error("could not connect to database."))}})}var t={name:"unitycache",version:3},r={name:"requeststore",version:1},n={name:"webassembly",version:1},o=window.indexeddb||window.mozindexeddb||window.webkitindexeddb||window.msindexeddb;e.unitycachedatabase=t,e.requeststore=r,e.webassemblystore=n;var a=null;return e.getinstance=function(){return a||(a=new e),a},e.destroyinstance=function(){return a?a.close().then(function(){a=null}):promise.resolve()},e.clearcache=function(){return e.destroyinstance().then(function(){return new promise(function(e,r){var n=o.deletedatabase(t.name);n.onsuccess=function(){e()},n.onerror=function(){r(new error("could not delete database."))},n.onblocked=function(){r(new error("database blocked."))}})})},e.prototype.execute=function(e,t,r){return this.isconnected.then(function(){return new promise(function(n,o){try{if(null===this.database)return void o(new error("indexeddb access denied"));var a=["put","delete","clear"].indexof(t)!=-1?"readwrite":"readonly",s=this.database.transaction([e],a),i=s.objectstore(e);"openkeycursor"==t&&(i=i.index(r[0]),r=r.slice(1));var d=i[t].apply(i,r);d.onsuccess=function(e){n(e.target.result)},d.onerror=function(e){o(e)}}catch(e){o(e)}}.bind(this))}.bind(this))},e.prototype.loadrequest=function(e){return this.execute(r.name,"get",[e])},e.prototype.storerequest=function(e){return this.execute(r.name,"put",[e])},e.prototype.close=function(){return this.isconnected.then(function(){this.database&&(this.database.close(),this.database=null)}.bind(this))},e}(),c.cachedfetch=function(){function e(e){console.log("[unitycache] "+e)}function t(e){return t.link=t.link||document.createelement("a"),t.link.href=e,t.link.href}function r(e){var t=window.location.href.match(/^[a-z]+:\/\/[^\/]+/);return!t||e.lastindexof(t[0],0)}function n(e){e=e||{},this.headers=new headers,object.keys(e.headers).foreach(function(t){this.headers.set(t,e.headers[t])}.bind(this)),this.redirected=e.redirected,this.status=e.status,this.statustext=e.statustext,this.type=e.type,this.url=e.url,this.parsedbody=e.parsedbody,object.defineproperty(this,"ok",{get:function(){return this.status>=200&&this.status<=299}.bind(this)})}function o(e,t,r,n,o){var a={url:e,version:d.version,company:t,product:r,updated:n,revalidated:n,accessed:n,response:{headers:{}}};return o&&(o.headers.foreach(function(e,t){a.response.headers[t]=e}),["redirected","status","statustext","type","url"].foreach(function(e){a.response[e]=o[e]}),a.response.parsedbody=o.parsedbody),a}function a(e,t){return(!t||!t.method||"get"===t.method)&&((!t||["must-revalidate","immutable"].indexof(t.control)!=-1)&&!!e.match("^https?://"))}function s(s,l){function c(t,r){return u(t,r).then(function(t){return!g.enabled||g.revalidated?t:304===t.status?(g.result.revalidated=g.result.accessed,g.revalidated=!0,f.storerequest(g.result).then(function(){e("'"+g.result.url+"' successfully revalidated and served from the indexeddb cache")}).catch(function(t){e("'"+g.result.url+"' successfully revalidated but not stored in the indexeddb cache due to the error: "+t)}),new n(g.result.response)):(200==t.status?(g.result=o(t.url,g.company,g.product,g.accessed,t),g.revalidated=!0,f.storerequest(g.result).then(function(){e("'"+g.result.url+"' successfully downloaded and stored in the indexeddb cache")}).catch(function(t){e("'"+g.result.url+"' successfully downloaded but not stored in the indexeddb cache due to the error: "+t)})):e("'"+g.result.url+"' request failed with status: "+t.status+" "+t.statustext),t)})}function h(e){l&&l.onprogress&&(l.onprogress({type:"progress",total:e.parsedbody.length,loaded:e.parsedbody.length,lengthcomputable:!0}),l.onprogress({type:"load",total:e.parsedbody.length,loaded:e.parsedbody.length,lengthcomputable:!0}))}var f=i.getinstance(),p=t("string"==typeof s?s:s.url),g={enabled:a(p,l)};return l&&(g.control=l.control,g.company=l.company,g.product=l.product),g.result=o(p,g.company,g.product,date.now()),g.revalidated=!1,g.enabled?f.loadrequest(g.result.url).then(function(t){if(!t||t.version!==d.version)return c(s,l);g.result=t,g.result.accessed=date.now();var o=new n(g.result.response);if("immutable"==g.control)return g.revalidated=!0,f.storerequest(g.result),e("'"+g.result.url+"' served from the indexeddb cache without revalidation"),h(o),o;if(r(g.result.url)&&(o.headers.get("last-modified")||o.headers.get("etag")))return fetch(g.result.url,{method:"head"}).then(function(t){return g.revalidated=["last-modified","etag"].every(function(e){return!o.headers.get(e)||o.headers.get(e)==t.headers.get(e)}),g.revalidated?(g.result.revalidated=g.result.accessed,f.storerequest(g.result),e("'"+g.result.url+"' successfully revalidated and served from the indexeddb cache"),h(o),o):c(s,l)});l=l||{};var a=l.headers||{};return l.headers=a,o.headers.get("last-modified")?(a["if-modified-since"]=o.headers.get("last-modified"),a["cache-control"]="no-cache"):o.headers.get("etag")&&(a["if-none-match"]=o.headers.get("etag"),a["cache-control"]="no-cache"),c(s,l)}).catch(function(t){return e("failed to load '"+g.result.url+"' from indexeddb cache due to the error: "+t),u(s,l)}):u(s,l)}var i=c.unitycache,d=i.requeststore,u=c.fetchwithprogress;return n.prototype.arraybuffer=function(){return promise.resolve(this.parsedbody.buffer)},n.prototype.blob=function(){return this.arraybuffer().then(function(e){return new blob([e])})},n.prototype.json=function(){return this.text().then(function(e){return json.parse(e)})},n.prototype.text=function(){var e=new textdecoder;return promise.resolve(e.decode(this.parsedbody))},s}(),new promise(function(e,t){c.systeminfo.haswebgl?1==c.systeminfo.haswebgl?t('your browser does not support graphics api "webgl 2" which is required for this content.'):c.systeminfo.haswasm?(1==c.systeminfo.haswebgl&&c.print('warning: your browser does not support "webgl 2" graphics api, switching to "webgl 1"'),c.startuperrorhandler=t,r(0),c.postrun.push(function(){r(1),delete c.startuperrorhandler,e(m)}),l()):t("your browser does not support webassembly."):t("your browser does not support webgl.")})}