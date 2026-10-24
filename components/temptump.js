  {variant === "warning" ? (
    <div>
      {(() => {
        const rawContent = boxLines
          .join("\n")
          .replace(/^\s*⚠️?\s*\*\*Important:\s*Read before acting\*\*\s*/i, "")
          .replace(/^\s*\*\*Important:\s*Read before acting\*\*\s*/i, "");

        const items = splitWarningItems(rawContent);

        return (
          <>
            <div className="mb-3 flex items-start gap-2 font-semibold text-white">
              <span className="shrink-0">⚠️</span>
              <span>Important: Read before acting</span>
            </div>

            <ul className="list-disc space-y-3 pl-5 marker:text-amber-400">
              {items.map((item, itemIndex) => (
                <li key={itemIndex} className="break-words pl-1">
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          </>
        );
      })()}
    </div>
  ) : (
    renderAIMessage(boxLines.join("\n"))
  )}