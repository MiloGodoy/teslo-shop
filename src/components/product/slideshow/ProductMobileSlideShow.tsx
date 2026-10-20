'use client'

import { ProductImage } from '@/components/product/product-image/ProductImage';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode, Pagination } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';


import './slideshow.css';

interface Props {
    images: string[];
    title: string;
    className?: string;
}

export const ProductMobileSlideShow = ({ images, title, className }: Props) => {



    return (
        <div className={className}>
            <Swiper
                style={{
                    width: '100vw',
                    height: '500px'
                }}
                pagination
                autoplay={{
                    delay: 2500
                }}
                modules={[FreeMode, Autoplay, Pagination]}
                className="mySwiper2"
            >
                {
                    (images.length ? images : ['/imgs/placeholder.jpg']).map( image => (
                        <SwiperSlide key={ image }>
                            <ProductImage
                                width={ 600 }
                                height={ 500 }
                                src={image}
                                alt={ title }
                                className='object-fill'
                            />
                        </SwiperSlide>
                    ))
                }

            </Swiper>

        </div>
    );
};
