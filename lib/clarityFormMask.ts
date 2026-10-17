/** Attribute Clarity treats as a strict mask. The value is the capital-T form Clarity documents. */
export const CLARITY_MASK_ATTR = "data-clarity-mask";
export const CLARITY_MASK_VALUE = "True";
export const CLARITY_MASK_SELECTOR = "form,input,textarea,select";

/**
 * Inline masker injected before the Clarity tag.
 * maskForms selects form, input, textarea, and select. maskOne marks that
 * element, except a checkbox, radio, range, or button input with no masked
 * ancestor: Clarity does not treat those types as masked fields, so the
 * parent (the label or control group) is marked instead. Mutations mask only
 * the added node, which covers estimator, consultation, and intake fields
 * rendered later without editing the shared estimator.
 */
export const clarityFormMaskScript = `(function(){
  var SELECTOR=${JSON.stringify(CLARITY_MASK_SELECTOR)};
  var ATTR=${JSON.stringify(CLARITY_MASK_ATTR)};
  var VALUE=${JSON.stringify(CLARITY_MASK_VALUE)};
  var CHOICE={checkbox:1,radio:1,range:1,button:1};
  function hasMaskedAncestor(el){
    var parent=el.parentElement;
    while(parent){
      if(typeof parent.getAttribute==="function"&&parent.getAttribute(ATTR)===VALUE) return true;
      parent=parent.parentElement;
    }
    return false;
  }
  function maskOne(el){
    if(!el||el.nodeType!==1||typeof el.setAttribute!=="function") return;
    var tag=el.tagName?String(el.tagName).toLowerCase():"";
    if(tag!=="form"&&tag!=="input"&&tag!=="textarea"&&tag!=="select") return;
    if(tag==="input"){
      var type=el.type?String(el.type).toLowerCase():"";
      if(!type&&typeof el.getAttribute==="function"&&el.getAttribute("type")) type=String(el.getAttribute("type")).toLowerCase();
      if(CHOICE[type]){
        if(!hasMaskedAncestor(el)){
          var parent=el.parentElement;
          var parentTag=parent&&parent.tagName?String(parent.tagName).toLowerCase():"";
          if(parent&&typeof parent.setAttribute==="function"&&parentTag!=="body"&&parentTag!=="html") parent.setAttribute(ATTR, VALUE);
          else el.setAttribute(ATTR, VALUE);
        }
        return;
      }
    }
    el.setAttribute(ATTR, VALUE);
  }
  function maskForms(root){
    if(!root) return;
    maskOne(root);
    if(typeof root.querySelectorAll!=="function") return;
    var nodes=root.querySelectorAll(SELECTOR);
    for(var i=0;i<nodes.length;i++) maskOne(nodes[i]);
  }
  function onMutations(mutations){
    if(!mutations) return;
    for(var i=0;i<mutations.length;i++){
      var added=mutations[i].addedNodes;
      if(!added) continue;
      for(var j=0;j<added.length;j++) maskForms(added[j]);
    }
  }
  function start(){
    maskForms(document);
    if(typeof MutationObserver!=="function"||!document.documentElement) return;
    new MutationObserver(onMutations).observe(document.documentElement,{childList:true,subtree:true});
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();`;
