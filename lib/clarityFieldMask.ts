/**
 * Masks form content for Microsoft Clarity before the tag loads.
 *
 * The shared estimator is not edited. Masking each form covers the text it
 * echoes, including the project description and "sent to ${email}"
 * (P5Estimator.tsx:860), address suggestions (ConsultationForm.tsx:802),
 * and contact-method radios (ConsultationForm.tsx:716). A checkbox, radio,
 * range, or button input outside a masked form marks its parent, which
 * covers the labels at P5Estimator.tsx:853 and P5IntakeReview.tsx:31.
 * Mutations scan only the nodes that were added.
 */
export function clarityFieldMaskBootstrap(): string {
  return `(function(){
    var attr='data-clarity-mask';
    function closestMasked(node){
      var current=node&&node.parentNode;
      while(current){
        if(current.getAttribute&&current.getAttribute(attr)==='True') return true;
        current=current.parentNode;
      }
      return false;
    }
    function maskOne(node){
      if(!node||node.nodeType!==1) return;
      var name=node.nodeName;
      if(name==='FORM'||name==='INPUT'||name==='TEXTAREA'||name==='SELECT') node.setAttribute(attr,'True');
      if(name!=='INPUT') return;
      var type=String((node.getAttribute&&node.getAttribute('type'))||node.type||'').toLowerCase();
      var parent=node.parentNode;
      var parentName=parent&&parent.nodeName;
      if((type==='checkbox'||type==='radio'||type==='range'||type==='button')&&!closestMasked(node)&&parent&&parent.setAttribute&&parentName!=='BODY'&&parentName!=='HTML'){
        parent.setAttribute(attr,'True');
      }
    }
    function maskForms(root){
      if(!root) return;
      if(root.nodeType===1) maskOne(root);
      if(typeof root.querySelectorAll!=='function') return;
      var nodes=root.querySelectorAll('form,input,textarea,select');
      for(var i=0;i<nodes.length;i++) maskOne(nodes[i]);
    }
    function watch(){
      maskForms(document);
      if(!document.body||typeof MutationObserver!=='function') return;
      new MutationObserver(function(records){
        for(var i=0;i<records.length;i++){
          var added=records[i].addedNodes||[];
          for(var j=0;j<added.length;j++){
            if(added[j]&&added[j].nodeType===1) maskForms(added[j]);
          }
        }
      }).observe(document.body,{childList:true,subtree:true});
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',watch);
    else watch();
  })();`;
}
