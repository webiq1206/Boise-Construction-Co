/** Bridge a CMP's standard gtag consent commands; no invented consent or new banner. */
export function consentBootstrap():string {
  return `(function(){
    if(window.p5UpdateConsent)return;
    var denied={analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'};
    window.p5Consent=Object.assign({},denied);
    window.p5ConsentResolved=false;
    window.dataLayer=window.dataLayer||[];
    var original=window.gtag||function(){window.dataLayer.push(arguments);};
    function update(value){
      Object.keys(denied).forEach(function(k){if(value[k]==='granted'||value[k]==='denied')window.p5Consent[k]=value[k];});
      window.dispatchEvent(new CustomEvent('p5:consent'));
    }
    window.gtag=function(){
      var result=original.apply(window,arguments);
      if(arguments[0]==='consent'&&(arguments[1]==='update'||arguments[1]==='default')&&arguments[2]){
        if(arguments[1]==='update')window.p5ConsentResolved=true;
        update(arguments[2]);
      }
      return result;
    };
    window.gtag('consent','default',Object.assign({},denied,{wait_for_update:500}));
    window.p5UpdateConsent=function(value){window.gtag('consent','update',value);};
  })();`;
}
