import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);
gsap.defaults({ ease: 'power3.out', duration: 0.9 });

/** Shared easing language: everything settles, nothing bounces */
export const EASE = {
  out: 'power3.out',
  expo: 'expo.out',
  inOut: 'power2.inOut',
} as const;

export { gsap, ScrollTrigger, useGSAP };
