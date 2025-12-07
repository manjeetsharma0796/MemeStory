"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Transformer } from 'react-konva';
import useImage from 'use-image';

interface MemeCanvasProps {
    imageUrl: string;
    texts: Array<{
        id: string;
        content: string;
        x: number;
        y: number;
        fontSize: number;
        color: string;
    }>;
    onUpdateText: (id: string, newAttrs: any) => void;
    onSelectText: (id: string | null) => void;
    selectedId: string | null;
    stageRef: any;
}

const URLImage = ({ src, width, height }: { src: string, width: number, height: number }) => {
    const [image] = useImage(src, 'anonymous'); // Check CORS
    return <KonvaImage image={image} width={width} height={height} />;
};

export function MemeCanvas({ imageUrl, texts, onUpdateText, onSelectText, selectedId, stageRef }: MemeCanvasProps) {
    const [stageSize, setStageSize] = useState({ width: 500, height: 500 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            setStageSize({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight
            });
        }
    }, []);

    const checkDeselect = (e: any) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            onSelectText(null);
        }
    };

    return (
        <div className="w-full h-full bg-slate-100 rounded-lg overflow-hidden" ref={containerRef}>
            <Stage
                width={stageSize.width}
                height={stageSize.height}
                onMouseDown={checkDeselect}
                onTouchStart={checkDeselect}
                ref={stageRef}
            >
                <Layer>
                    {imageUrl && <URLImage src={imageUrl} width={stageSize.width} height={stageSize.height} />}

                    {texts.map((text) => (
                        <EditableText
                            key={text.id}
                            shapeProps={text}
                            isSelected={text.id === selectedId}
                            onSelect={() => onSelectText(text.id)}
                            onChange={(newAttrs) => onUpdateText(text.id, newAttrs)}
                        />
                    ))}
                </Layer>
            </Stage>
        </div>
    );
}

const EditableText = ({ shapeProps, isSelected, onSelect, onChange }: any) => {
    const shapeRef = useRef<any>();
    const trRef = useRef<any>();

    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    return (
        <>
            <Text
                onClick={onSelect}
                onTap={onSelect}
                ref={shapeRef}
                {...shapeProps}
                draggable
                fontFamily="Impact"
                stroke="black"
                strokeWidth={2}
                fill="white"
                padding={5}
                onDragEnd={(e) => {
                    onChange({
                        ...shapeProps,
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={(e) => {
                    const node = shapeRef.current;
                    const scaleX = node.scaleX();
                    // Adjust font size based on scale and reset scale to 1
                    const newFontSize = Math.max(5, node.fontSize() * scaleX);

                    node.scaleX(1);
                    node.scaleY(1);

                    onChange({
                        ...shapeProps,
                        x: node.x(),
                        y: node.y(),
                        fontSize: newFontSize,
                        rotation: node.rotation()
                    });
                }}
            />
            {isSelected && (
                <Transformer
                    ref={trRef}
                    enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </>
    );
};
