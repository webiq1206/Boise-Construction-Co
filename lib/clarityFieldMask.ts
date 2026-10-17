/**
 * Sets data-clarity-mask="True" on every form field, including fields the
 * shared estimator engine renders. That engine is synced and is not edited
 * here. The script runs before Microsoft Clarity (lazyOnload) and watches
 * for fields added later.
 */
export function clarityFieldMaskBootstrap(): string {
  return `(function(){
    var attr='data-clarity-mask';
    function isField(node){
      return !!(node&&node.nodeType===1&&(node.nodeName==='INPUT'||node.nodeName==='TEXTAREA'||node.nodeName==='SELECT'));
    }
    function mask(root){
      if(!root||typeof root.querySelectorAll!=='function')return;
      var fields=root.querySelectorAll('input,textarea,select');
      for(var i=0;i<fields.length;i++) fields[i].setAttribute(attr,'True');
    }
    function watch(){
      mask(document);
      if(!document.body||typeof MutationObserver!=='function')return;
      new MutationObserver(function(records){
        for(var i=0;i<records.length;i++){
          var added=records[i].addedNodes||[];
          for(var j=0;j<added.length;j++){
            var node=added[j];
            if(isField(node)) node.setAttribute(attr,'True');
            if(node&&node.nodeType===1) mask(node);
          }
        }
      }).observe(document.body,{childList:true,subtree:true});
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',watch);
    else watch();
  })();`;
}
