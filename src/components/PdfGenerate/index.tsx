import React from "react";
import { jsPDF } from "jspdf";
import { FabricJSCanvas, useFabricJSEditor } from "fabricjs-react";
import { fabric } from "fabric";
import "svg2pdf.js";
import styled from "styled-components";
import { fonts, setFonts } from "./utils";

const fontsManager = (collection: NodeListOf<SVGTextElement>) => {
  let missedFont: string;
  let missedFontSize: string;

  return collection.forEach((text: SVGTextElement) => {
    (text.childNodes as NodeListOf<SVGTSpanElement>).forEach(
      (tspan: SVGTSpanElement) => {
        const currFont = tspan.style.fontFamily;
        const currFontSize = tspan.style.fontSize;

        const findedFont = Object.keys(fonts).filter(
          (t) => currFont.replace(/['"]+/g, "").toLowerCase() === t
        )[0];
        console.log({ findedFont });
        if (findedFont) {
          if (
            tspan.style.fontWeight === "bold" &&
            tspan.style.fontStyle === "italic"
          ) {
            tspan.style.fontFamily = `${fonts[findedFont][3]}`;
            missedFont = `${fonts[findedFont][3]}`;
            missedFontSize = currFontSize;
          } else if (tspan.style.fontWeight === "bold") {
            tspan.style.fontFamily = `${fonts[findedFont][1]}`;
            missedFont = `${fonts[findedFont][1]}`;
            missedFontSize = currFontSize;
          } else if (tspan.style.fontStyle === "italic") {
            tspan.style.fontFamily = `${fonts[findedFont][2]}`;
            missedFont = `${fonts[findedFont][2]}`;
            missedFontSize = currFontSize;
          } else {
            tspan.style.fontFamily = `${fonts[findedFont][0]}`;
            missedFont = `${fonts[findedFont][0]}`;
            missedFontSize = currFontSize;
          }
        } else {
          // this is for vars like @VarUserName
          tspan.style.fontFamily = missedFont;
          if (missedFont.includes("Bold Italic")) {
            tspan.style.fontWeight = "bold";
            tspan.style.fontStyle = "italic";
            tspan.style.fontSize = missedFontSize;
          } else if (missedFont.includes("Bold")) {
            tspan.style.fontWeight = "bold";
            tspan.style.fontSize = missedFontSize;
          } else if (missedFont.includes("Italic")) {
            tspan.style.fontStyle = "italic";
            tspan.style.fontSize = missedFontSize;
          } else {
            tspan.style.fontWeight = "normal";
            tspan.style.fontSize = missedFontSize;
          }
        }
      }
    );
  });
};

const StyledFakeA4 = styled.div`
  .fakeA4 {
    display: block;
    min-width: 842px;
    min-height: 595px;
    border: 1px solid #d9d9d9;
    box-shadow: 0 2px 0 rgb(0 0 0 / 2%);
  }
  .fakeA4 > * {
    display: block;
    width: 100%;
    height: 100%;
  }
`;

export const PdfGenerate: React.FC<{
  initialValue: any;
  onRendered: () => void;
  width?: number;
  height?: number;
}> = ({ initialValue, width = 840, height = 592, onRendered }) => {
  const { onReady } = useFabricJSEditor();

  const onCanvasReady = (canvas: fabric.Canvas) => {
    if (initialValue) {
      try {
        const data =
          typeof initialValue === "string"
            ? JSON.parse(initialValue)
            : initialValue;

        canvas.loadFromJSON(data, () => {
          const svgDef = canvas.toSVG();

          const doc = new jsPDF("l", "px", [width, height]);
          setFonts(doc);
          const parser = new DOMParser();
          const element = parser.parseFromString(svgDef, "image/svg+xml");
          const bg = element.documentElement.querySelector("rect");
          const texts = element.documentElement.querySelectorAll("text");

          // hack for background
          // svg2pdf.js don't support % units (for now)

          if (bg) {
            bg.setAttribute("width", width + "px");
            bg.setAttribute("height", height + "px");
          }

          if (texts) {
            fontsManager(texts);
          }

          doc.svg(element.documentElement).then(() => {
            doc.save("myPDF.pdf");
            onRendered();
          });
        });
      } catch (err) {
        // this is not a json
      }
    }
    onReady(canvas);
  };

  return (
    <StyledFakeA4>
      <div className="fakeA4">
        <FabricJSCanvas onReady={onCanvasReady} />
      </div>
    </StyledFakeA4>
  );
};

export default PdfGenerate;
