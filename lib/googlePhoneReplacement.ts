/** Executed by Google's documented phone_conversion_callback, never by a click handler. */
export function googlePhoneReplacementBootstrap():string {
  return `
  var phoneNodes=[],phoneLinks=[],phoneValue=null,phoneObserver=null,phoneConfigured=false;
  function phoneAllowed(){var c=window.p5Consent||{};return c.ad_storage==='granted'&&c.ad_user_data==='granted';}
  function restorePhone(){
    if(phoneObserver){phoneObserver.disconnect();phoneObserver=null;}
    phoneNodes.forEach(function(v){if(v.node.nodeValue===v.replaced)v.node.nodeValue=v.original;});
    phoneLinks.forEach(function(v){if(v.node.getAttribute('href')===v.replaced)v.node.setAttribute('href',v.original);});
    phoneNodes=[];phoneLinks=[];phoneValue=null;phoneConfigured=false;
  }
  function replacePhone(){
    if(!phoneValue||!document.body||!phoneAllowed())return;
    var digits=function(s){return String(s).replace(/\\D/g,'').replace(/^1(?=\\d{10}$)/,'');};
    document.querySelectorAll('a[href^="tel:"]').forEach(function(a){
      var original=a.getAttribute('href');
      if(digits(original)!==digits(config.phoneNumber))return;
      var replacement='tel:'+phoneValue.mobile;
      if(original===replacement)return;
      phoneLinks.push({node:a,original:original,replaced:replacement});a.setAttribute('href',replacement);
    });
    var walker=document.createTreeWalker(document.body,4),node;
    while((node=walker.nextNode())){
      if(node.parentElement&&node.parentElement.closest('script,style,noscript,textarea,input'))continue;
      var original=node.nodeValue;
      if(!original||original.indexOf(config.phoneNumber)<0)continue;
      var replacement=original.split(config.phoneNumber).join(phoneValue.formatted);
      if(replacement===original)continue;
      phoneNodes.push({node:node,original:original,replaced:replacement});node.nodeValue=replacement;
    }
  }
  function configurePhone(){
    if(!phoneAllowed()){restorePhone();return;}
    if(phoneConfigured||!config.phoneConversionLabel||!config.phoneNumber)return;
    phoneConfigured=true;
    window.gtag('config',config.adsId+'/'+config.phoneConversionLabel,{
      phone_conversion_number:config.phoneNumber,
      phone_conversion_callback:function(formatted,mobile){
        if(!phoneAllowed()||typeof formatted!=='string'||typeof mobile!=='string'
          ||!/^[+\\d ()-]{7,30}$/.test(formatted)||!/^\\+?\\d{10,15}$/.test(mobile))return;
        phoneValue={formatted:formatted,mobile:mobile};
        replacePhone();
        if(!phoneObserver){phoneObserver=new MutationObserver(replacePhone);phoneObserver.observe(document.body,{childList:true,subtree:true,characterData:true});}
      },
      phone_conversion_options:{timeout:5000,cache:false}
    });
  }
  window.addEventListener('p5:consent',configurePhone);
  configurePhone();
`;
}
