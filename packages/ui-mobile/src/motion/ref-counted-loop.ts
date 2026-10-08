export interface RefCountedLoop {
  acquire: () => () => void;
  activeCount: () => number;
}

export function createRefCountedLoop(start: () => void, stop: () => void): RefCountedLoop {
  let count = 0;

  return {
    acquire: () => {
      count += 1;
      if (count === 1) start();
      let released = false;
      return () => {
        if (released) return;
        released = true;
        count -= 1;
        if (count === 0) stop();
      };
    },
    activeCount: () => count,
  };
}
