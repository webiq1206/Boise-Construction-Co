/** Bridge a CMP's standard gtag consent commands. Defaults are granted, matching the other P5 sites, which set no consent default. */
export function consentBootstrap():string {
  return `(function(){
    if(window.p5UpdateConsent)return;
    var granted={analytics_storage:'granted',ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'};
    window.p5Consent=Object.assign({},granted);
    window.p5ConsentResolved=false;
    window.dataLayer=window.dataLayer||[];
    var original=window.gtag||function(){window.dataLayer.push(arguments);};
    function update(value){
      Object.keys(granted).forEach(function(k){if(value[k]==='granted'||value[k]==='denied')window.p5Consent[k]=value[k];});
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
    window.gtag('consent','default',Object.assign({},granted,{wait_for_update:500}));
    window.p5UpdateConsent=function(value){window.gtag('consent','update',value);};
  })();`;
}
