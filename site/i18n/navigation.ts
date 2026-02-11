import {createNavigation} from 'next-intl/navigation';
import {routing} from './routing';

export const {usePathname, useRouter} = createNavigation(routing);
