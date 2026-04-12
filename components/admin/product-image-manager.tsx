"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Star, Trash2 } from "lucide-react";

import { deleteProductImage, setCoverImage, updateImageOrder } from "@/lib/admin-actions";
import { SubmitButton } from "@/components/admin/submit-button";
import type { ProductImage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getProductMedia } from "@/lib/product-media";

type ProductImageManagerProps = {
  productId: string;
  images: ProductImage[];
};

type SortableImageProps = {
  image: ProductImage;
  productId: string;
};

function SortableImage({ image, productId }: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "grid grid-cols-[auto_64px_1fr_auto] items-center gap-3 rounded-md border bg-background p-2",
        isDragging && "opacity-70"
      )}
    >
      <button
        type="button"
        className="cursor-grab rounded-md p-2 text-muted-foreground hover:bg-muted"
        {...attributes}
        {...listeners}
        aria-label="Reordenar imagem"
      >
        <GripVertical data-icon="inline-start" />
      </button>
      <img
        src={image.url}
        alt={image.alt_text ?? "Imagem do produto"}
        className="aspect-square rounded-md object-cover"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{image.storage_path}</p>
        <p className="text-xs text-muted-foreground">
          {image.is_cover ? "Imagem de capa" : "Imagem secundária"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <SubmitButton
          type="submit"
          size="sm"
          variant={image.is_cover ? "secondary" : "outline"}
          pendingLabel="Salvando..."
          formAction={setCoverImage.bind(null, productId, image.id)}
          formNoValidate
        >
          <Star data-icon="inline-start" />
          Capa
        </SubmitButton>
        <SubmitButton
          type="submit"
          size="sm"
          variant="destructive"
          pendingLabel="Excluindo..."
          confirmMessage="Excluir esta imagem do produto?"
          formAction={deleteProductImage.bind(null, productId, image.id)}
          formNoValidate
        >
          <Trash2 data-icon="inline-start" />
          Excluir
        </SubmitButton>
      </div>
    </li>
  );
}

export function ProductImageManager({ productId, images }: ProductImageManagerProps) {
  const sortedImages = useMemo(() => getProductMedia(images).images, [images]);
  const [items, setItems] = useState(sortedImages);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );
  const action = updateImageOrder.bind(null, productId);

  useEffect(() => {
    setItems(sortedImages);
  }, [sortedImages]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((current) => {
        const oldIndex = current.findIndex((item) => item.id === active.id);
        const newIndex = current.findIndex((item) => item.id === over.id);
        return arrayMove(current, oldIndex, newIndex);
      });
    }
  }

  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        Nenhuma imagem enviada ainda. Use o campo de upload do formulário.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DndContext
        id={`product-images-${productId}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-3">
            {items.map((image) => (
              <SortableImage key={image.id} image={image} productId={productId} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <input type="hidden" name="order" value={JSON.stringify(items.map((item) => item.id))} />
      <SubmitButton
        type="submit"
        variant="outline"
        pendingLabel="Salvando..."
        formAction={action}
        formNoValidate
      >
        Salvar ordem
      </SubmitButton>
    </div>
  );
}
