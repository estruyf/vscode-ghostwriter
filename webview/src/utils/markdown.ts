/**
 * Parses content to extract frontmatter and separate it from markdown content.
 * Handles cases where there might be a preamble before the frontmatter block.
 *
 * @param content The raw string content to parse
 * @returns Object containing the extracted frontmatter and cleaned markdown content
 */
export const parseContent = (
  content: string,
): { frontmatter: string; markdown: string } => {
  if (!content) {
    return { frontmatter: "", markdown: "" };
  }

  // Look for the start of frontmatter block
  // Matches "---" at the start of the string or on a new line
  const startMatch = content.match(/(?:^|\n)---\r?\n/);

  if (startMatch && startMatch.index !== undefined) {
    // Calculate the start index of the "---" delimiter
    const startIndex =
      startMatch.index + (startMatch[0].startsWith("\n") ? 1 : 0);

    // Look for the closing "---" delimiter
    const afterStartMarker = startIndex + 3;
    const remainingContent = content.slice(afterStartMarker);
    const endMatch = remainingContent.match(/\r?\n---(?:$|\r?\n)/);

    if (endMatch && endMatch.index !== undefined) {
      // Frontmatter found
      const frontmatter = remainingContent.slice(0, endMatch.index).trim();

      // Markdown content starts after the closing delimiter
      const markdown = remainingContent
        .slice(endMatch.index + endMatch[0].length)
        .trim();

      return { frontmatter, markdown };
    }
  }

  // If no valid frontmatter block found, return original content as markdown
  // The user specified: "If there is no frontmatter section, it can be kept."
  return { frontmatter: "", markdown: content };
};
