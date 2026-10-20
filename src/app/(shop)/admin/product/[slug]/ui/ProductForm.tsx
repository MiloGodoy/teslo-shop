"use client";

import { useForm, useWatch } from "react-hook-form";
import { Category, Product, ProductImage as ProductWithImage } from "@/interfaces";
import { useState } from 'react';
import { signImageUpload, discardUploadedImages } from '@/actions/product/sign-image-upload';
import clsx from "clsx";
import { createUpdateProduct, deleteProductImage } from "@/actions";
import { useRouter } from 'next/navigation';
import { ProductImage } from '@/components';
import { productSlugSchema } from '@/lib/product-validation';

interface Props {
  product: Partial<Product> & { ProductImage?: ProductWithImage[] };
  categories: Category[];
}

const sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

interface FormInputs {
  title: string;
  slug: string;
  description: string;
  price: number;
  inStock: number;
  sizes: string[];
  tags: string;
  gender: "men" | "women" | "kid" | "unisex";
  categoryId: string;

  images?: FileList;
}

export const ProductForm = ({ product, categories }: Props) => {

  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const {
    handleSubmit,
    register,
    formState: { errors },
    getValues,
    setValue,
    control,
  } = useForm<FormInputs>({
    defaultValues: {
      ...product,
      tags: product.tags?.join(", "),
      sizes: product.sizes ?? [],

      images: undefined,
    },
  });

  const selectedSizes = useWatch({ control, name: "sizes" });

  const onSizeChanged = (size: string) => {
    const sizes = new Set(getValues("sizes"));
    sizes.has(size) ? sizes.delete(size) : sizes.add(size);
    setValue("sizes", Array.from(sizes));
  };

  const onSubmit = async (data: FormInputs) => {
    const slug = productSlugSchema.safeParse(data.slug);
    if (!slug.success) {
      setMessage('Revisa el slug antes de subir las imágenes.');
      return;
    }
    const formData = new FormData();

    const { images, ...productToSave } = data;

    if ( product.id ){
      formData.append("id", product.id ?? "");
    }

    formData.append("title", productToSave.title);
    formData.append("slug", slug.data);
    formData.append("description", productToSave.description);
    formData.append("price", productToSave.price.toString());
    formData.append("inStock", productToSave.inStock.toString());
    formData.append("sizes", productToSave.sizes.toString());
    formData.append("tags", productToSave.tags);
    formData.append("categoryId", productToSave.categoryId);
    formData.append("gender", productToSave.gender);

    setIsSaving(true);
    setMessage('');
    const uploadedIds: string[] = [];
    try {
      const files = Array.from(images ?? []);
      if (files.length + (product.ProductImage?.length ?? 0) > 8) {
        throw new Error('Puedes guardar hasta 8 imágenes por producto.');
      }
      // Validate the complete selection before starting any upload.
      for (const file of files) {
        if (!['image/png', 'image/jpeg', 'image/webp', 'image/avif'].includes(file.type) ||
            !file.size || file.size > 5 * 1024 * 1024) {
          throw new Error('Usa imágenes JPG, PNG, WebP o AVIF de hasta 5 MB.');
        }
      }
      for (const file of files) {
        setMessage(`Subiendo imagen ${uploadedIds.length + 1} de ${files.length}…`);
        const signed = await signImageUpload();
        if (!signed.ok) throw new Error(signed.message);
        const upload = new FormData();
        upload.append('file', file);
        upload.append('api_key', signed.apiKey);
        upload.append('signature', signed.signature);
        for (const [key, value] of Object.entries(signed.params)) upload.append(key, String(value));
        uploadedIds.push(signed.params.public_id);
        const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, {
          method: 'POST', body: upload,
        });
        const result = await response.json();
        if (!response.ok || result.public_id !== signed.params.public_id) {
          throw new Error('Cloudinary rechazó la imagen. Revisa las credenciales y el archivo.');
        }
      }
      formData.append('uploadedImages', JSON.stringify(uploadedIds));
      setMessage('Guardando producto…');
      const result = await createUpdateProduct(formData);
      if (!result.ok) throw new Error(result.message);
      setValue('images', undefined);
      router.replace(`/admin/product/${result.product.slug}`);
      router.refresh();
      setMessage('Producto guardado.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar el producto.');
      if (uploadedIds.length) await discardUploadedImages(uploadedIds).catch(() => undefined);
    } finally {
      setIsSaving(false);
    }

  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () => setMessage('Revisa los campos marcados antes de guardar.'))}
      className="grid px-5 mb-16 grid-cols-1 sm:px-0 sm:grid-cols-2 gap-3"
    >
      {/* Textos */}
      <div className="w-full">
        <div className="flex flex-col mb-2">
          <span>Título</span>
          <input
            type="text"
            className="p-2 border rounded-md bg-gray-200"
            {...register("title", { required: true })}
          />
        </div>

        <div className="flex flex-col mb-2">
          <span>Slug</span>
          <input
            type="text"
            className="p-2 border rounded-md bg-gray-200"
            aria-invalid={!!errors.slug}
            {...register("slug", {
              required: 'El slug es obligatorio.',
              validate: (value) => productSlugSchema.safeParse(value).success ||
                'Usa letras, números, guiones, guiones bajos o paréntesis (3 a 255 caracteres).',
            })}
          />
          {errors.slug && <p role="alert" className="text-red-600">{errors.slug.message}</p>}
        </div>

        <div className="flex flex-col mb-2">
          <span>Descripción</span>
          <textarea
            rows={5}
            className="p-2 border rounded-md bg-gray-200"
            {...register("description", { required: true })}
          ></textarea>
        </div>

        <div className="flex flex-col mb-2">
          <span>Price</span>
          <input
            type="number"
            step="0.01"
            className="p-2 border rounded-md bg-gray-200"
            {...register("price", { required: true, min: 0 })}
          />
        </div>

        <div className="flex flex-col mb-2">
          <span>Tags</span>
          <input
            type="text"
            className="p-2 border rounded-md bg-gray-200"
            {...register("tags", { required: true })}
          />
        </div>

        <div className="flex flex-col mb-2">
          <span>Gender</span>
          <select
            className="p-2 border rounded-md bg-gray-200"
            {...register("gender", { required: true })}
          >
            <option value="">[Seleccione]</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="kid">Kid</option>
            <option value="unisex">Unisex</option>
          </select>
        </div>

        <div className="flex flex-col mb-2">
          <span>Categoria</span>
          <select
            className="p-2 border rounded-md bg-gray-200"
            {...register("categoryId", { required: true })}
          >
            <option value="">[Seleccione]</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <p role="status" className="my-3">{message}</p>
        <button disabled={isSaving} className="btn-primary w-full disabled:opacity-50">
          {isSaving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      {/* Selector de tallas y fotos */}
      <div className="w-full">
        <div className="flex flex-col mb-2">
          <span>Inventario</span>
          <input
            type="number"
            className="p-2 border rounded-md bg-gray-200"
            {...register("inStock", { required: true, min: 0 })}
          />
        </div>

        {/* As checkboxes */}
        <div className="flex flex-col">
          <span>Tallas</span>
          <div className="flex flex-wrap">
            {sizes.map((size) => (
              // bg-blue-500 text-white <--- si está seleccionado
              <div
                key={size}
                onClick={() => onSizeChanged(size)}
                className={clsx(
                  "p-2 border cursor-pointer rounded-md mr-2 mb-2 w-14 transition-all text-center",
                  {
                    "bg-blue-500 text-white": selectedSizes.includes(size),
                  }
                )}
              >
                <span>{size}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col mb-2">
            <span>Fotos</span>
            <input
              type="file"
              { ...register('images') }
              multiple
              className="p-2 border rounded-md bg-gray-200"
              accept="image/png, image/jpeg, image/webp, image/avif"
              disabled={isSaving}
            />
            <p className="text-sm mt-2">Las imágenes seleccionadas se subirán al pulsar Guardar.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {product.ProductImage?.map((image) => (
              <div key={image.id}>
                <ProductImage
                  alt={product.title ?? ""}
                  src={ image.url }
                  width={300}
                  height={300}
                  className="rounded-t shadow-md"
                />

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={async () => {
                    setIsSaving(true);
                    try {
                      const result = await deleteProductImage(image.id);
                      if (!result.ok) setMessage(result.message ?? 'No se pudo eliminar.');
                      else { setMessage('Imagen eliminada.'); router.refresh(); }
                    } catch { setMessage('No se pudo eliminar. Vuelve a intentar.'); }
                    finally { setIsSaving(false); }
                  }}
                  className="btn-danger w-full rounded-b-xl"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
};
