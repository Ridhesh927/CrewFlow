const fs = require('fs');
const path = require('path');

const avatarPath = 'E:/Project/On-Going/CrewFlow/frontend/src/components/ui/avatar.tsx';
if (fs.existsSync(avatarPath)) {
  let content = fs.readFileSync(avatarPath, 'utf8');
  content = content.replace(/function Avatar\(\{\n  className,\n  size = "default",\n  \.\.\.props\n\}\)/, 'function Avatar({\n  className,\n  size = "default",\n  ...props\n}: any)');
  content = content.replace(/function AvatarImage\(\{\n  className,\n  \.\.\.props\n\}\)/, 'function AvatarImage({\n  className,\n  ...props\n}: any)');
  content = content.replace(/function AvatarFallback\(\{\n  className,\n  \.\.\.props\n\}\)/, 'function AvatarFallback({\n  className,\n  ...props\n}: any)');
  
  // Also fix any other remaining functions
  content = content.replace(/function AvatarStatus\(\{\n  className,\n  \.\.\.props\n\}\)/, 'function AvatarStatus({\n  className,\n  ...props\n}: any)');
  content = content.replace(/function AvatarBadge\(\{\n  className,\n  \.\.\.props\n\}\)/, 'function AvatarBadge({\n  className,\n  ...props\n}: any)');
  content = content.replace(/function AvatarIcon\(\{\n  className,\n  \.\.\.props\n\}\)/, 'function AvatarIcon({\n  className,\n  ...props\n}: any)');
  
  fs.writeFileSync(avatarPath, content);
}
console.log("Avatar fixed!");
