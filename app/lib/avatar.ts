export const getAvatarUrl = (name: string) => {
  if (!name || name.startsWith('STU')) return `https://ui-avatars.com/api/?name=${name}&background=random&color=fff`;
  
  const firstName = name.split(' ')[0].toLowerCase();
  const isFemale = firstName.endsWith('a') || firstName.endsWith('i') || firstName.endsWith('y') || firstName.endsWith('e');
  const gender = isFemale ? 'women' : 'men';
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = (Math.abs(hash) % 99) + 1; 
  
  return `https://randomuser.me/api/portraits/${gender}/${index}.jpg`;
};
