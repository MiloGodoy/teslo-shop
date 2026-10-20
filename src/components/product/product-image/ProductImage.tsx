'use client';
import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { getProductImageSrc } from '@/utils/product-image';
type Props = Omit<ImageProps, 'src'> & { src?: string | null };
export const ProductImage = ({ src, alt, onError, ...props }: Props) => {
  const resolved = getProductImageSrc(src);
  const [failedSrc, setFailedSrc] = useState<string>();
  return <Image {...props} alt={alt}
    src={failedSrc === resolved ? '/imgs/placeholder.jpg' : resolved}
    onError={(event) => { setFailedSrc(resolved); onError?.(event); }} />;
};
