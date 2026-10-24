'use client';
import {useEffect} from 'react';
import {usePathname,useSearchParams} from 'next/navigation';
import {captureAttribution,handleAttributionConsent} from '@/lib/leadAttributionBrowser';

/** Invisible metadata only. No additional form, requests, or CRM submissions. */
export function LeadAttribution(){
  const pathname=usePathname(),search=useSearchParams();
  useEffect(()=>{captureAttribution();},[pathname,search]);
  useEffect(()=>{
    window.addEventListener('p5:consent',handleAttributionConsent);
    return ()=>window.removeEventListener('p5:consent',handleAttributionConsent);
  },[]);
  return null;
}
